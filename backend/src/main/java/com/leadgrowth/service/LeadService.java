package com.leadgrowth.service;

import com.leadgrowth.dto.LeadDto;
import com.leadgrowth.dto.LeadNoteRequest;
import com.leadgrowth.dto.AddActivityLogRequest;
import com.leadgrowth.dto.CompleteStepRequest;
import com.leadgrowth.dto.SalesActivityLogDto;
import com.leadgrowth.entity.Campaign;
import com.leadgrowth.entity.Lead;
import com.leadgrowth.entity.LeadNote;
import com.leadgrowth.entity.User;
import com.leadgrowth.entity.LeadAssignment;
import com.leadgrowth.entity.AssignmentLog;
import com.leadgrowth.entity.Notification;
import com.leadgrowth.entity.Workspace;
import com.leadgrowth.dto.LeadHistoryDto;
import com.leadgrowth.dto.SalesActivityDto;
import com.leadgrowth.entity.SalesActivity;
import com.leadgrowth.entity.SalesActivityLog;
import com.leadgrowth.entity.FollowupReminder;
import com.leadgrowth.entity.LeadHistory;
import com.leadgrowth.repository.*;
import com.leadgrowth.websocket.WebSocketManager;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class LeadService {

    private final LeadRepository leadRepository;
    private final LeadNoteRepository leadNoteRepository;
    private final UserRepository userRepository;
    private final CampaignRepository campaignRepository;
    private final WebSocketManager webSocketManager;
    private final LeadAssignmentRepository leadAssignmentRepository;
    private final AssignmentLogRepository assignmentLogRepository;
    private final NotificationRepository notificationRepository;
    private final SalesActivityRepository salesActivityRepository;
    private final LeadHistoryRepository leadHistoryRepository;
    private final SalesActivityLogRepository salesActivityLogRepository;
    private final FollowupRepository followupRepository;

    public LeadService(
            LeadRepository leadRepository,
            LeadNoteRepository leadNoteRepository,
            UserRepository userRepository,
            CampaignRepository campaignRepository,
            @Lazy WebSocketManager webSocketManager,
            LeadAssignmentRepository leadAssignmentRepository,
            AssignmentLogRepository assignmentLogRepository,
            NotificationRepository notificationRepository,
            SalesActivityRepository salesActivityRepository,
            LeadHistoryRepository leadHistoryRepository,
            SalesActivityLogRepository salesActivityLogRepository,
            FollowupRepository followupRepository
    ) {
        this.leadRepository = leadRepository;
        this.leadNoteRepository = leadNoteRepository;
        this.userRepository = userRepository;
        this.campaignRepository = campaignRepository;
        this.webSocketManager = webSocketManager;
        this.leadAssignmentRepository = leadAssignmentRepository;
        this.assignmentLogRepository = assignmentLogRepository;
        this.notificationRepository = notificationRepository;
        this.salesActivityRepository = salesActivityRepository;
        this.leadHistoryRepository = leadHistoryRepository;
        this.salesActivityLogRepository = salesActivityLogRepository;
        this.followupRepository = followupRepository;
    }

    public List<LeadDto> getLeads(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        if (user.getWorkspace() == null) {
            throw new IllegalStateException("User does not belong to a workspace");
        }

        boolean isUserOnly = user.getRoles().stream()
                .anyMatch(r -> r.getName().equalsIgnoreCase("ROLE_USER") || r.getName().equalsIgnoreCase("USER")) &&
                user.getRoles().stream().noneMatch(r -> r.getName().equalsIgnoreCase("ROLE_ADMIN") || r.getName().equalsIgnoreCase("ADMIN") || r.getName().equalsIgnoreCase("ROLE_MANAGER") || r.getName().equalsIgnoreCase("MANAGER"));

        List<Lead> leads;
        if (isUserOnly) {
            leads = leadRepository.findByAssignedToIdOrderByCreatedAtDesc(user.getId());
            if (leads.isEmpty() && user.getWorkspace() != null) {
                leads = leadRepository.findByWorkspaceIdAndAssignedToIdOrderByCreatedAtDesc(
                        user.getWorkspace().getId(), user.getId()
                );
            }
        } else {
            leads = leadRepository.findByWorkspaceIdOrderByCreatedAtDesc(user.getWorkspace().getId());
        }

        return leads.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    @Transactional
    public LeadDto createLead(LeadDto dto, String userEmail) {
        User creator = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        
        Campaign campaign = null;
        if (dto.getCampaignId() != null) {
            campaign = campaignRepository.findById(dto.getCampaignId()).orElse(null);
        }

        User assignedTo = null;
        String algorithmDetails = null;

        // Auto Assignment Trigger
        if (dto.getAssignedToId() != null && dto.getAssignedToId() == -1) {
            assignedTo = findBestLeadAssignee(creator.getWorkspace());
            if (assignedTo != null) {
                algorithmDetails = "Assigned via Hybrid Auto-Assignment Lead Algorithm.";
            } else {
                algorithmDetails = "Auto-Assignment requested but no eligible sales agents available. Kept in Lead Queue.";
            }
        } else if (dto.getAssignedToId() != null && dto.getAssignedToId() > 0) {
            assignedTo = userRepository.findById(dto.getAssignedToId()).orElse(null);
            algorithmDetails = "Assigned manually by Creator.";
        }

        Lead lead = Lead.builder()
                .workspace(creator.getWorkspace())
                .campaign(campaign)
                .name(dto.getName())
                .email(dto.getEmail())
                .phone(dto.getPhone())
                .sourcePlatform(dto.getSourcePlatform() != null ? dto.getSourcePlatform() : "Manual Leads")
                .campaignName(dto.getCampaignName())
                .status("New")
                .assignedTo(assignedTo)
                .build();

        Lead saved = leadRepository.save(lead);

        if (campaign != null) {
            campaign.setLeadsCount(campaign.getLeadsCount() + 1);
            campaignRepository.save(campaign);
        }

        if (assignedTo != null) {
            assignedTo.setLastAssignedAt(LocalDateTime.now());
            userRepository.save(assignedTo);

            // Log lead assignment
            leadAssignmentRepository.save(new LeadAssignment(saved, assignedTo));
            assignmentLogRepository.save(new AssignmentLog(
                    creator.getWorkspace(), "LEAD", saved.getId(), assignedTo, algorithmDetails
            ));

            // Notify Assignee
            createAndSendNotification(assignedTo, "New Lead Assigned", 
                    "You have been assigned to lead: \"" + saved.getName() + "\" from source \"" + saved.getSourcePlatform() + "\".");
        } else {
            // Log queue entry
            assignmentLogRepository.save(new AssignmentLog(
                    creator.getWorkspace(), "LEAD", saved.getId(), null, "Lead added to workspace queue."
            ));
        }

        LeadDto resultDto = convertToDto(saved);
        webSocketManager.broadcastLead(creator.getWorkspace().getId(), resultDto);
        return resultDto;
    }

    @Transactional
    public LeadDto updateStatus(Long leadId, String status, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new IllegalArgumentException("Lead not found"));

        boolean isUserOnly = user.getRoles().stream()
                .anyMatch(r -> r.getName().equals("ROLE_USER")) &&
                user.getRoles().stream().noneMatch(r -> r.getName().equals("ROLE_ADMIN") || r.getName().equals("ROLE_MANAGER"));

        if (isUserOnly && (lead.getAssignedTo() == null || !lead.getAssignedTo().getId().equals(user.getId()))) {
            throw new IllegalStateException("You are not authorized to update this lead's status");
        }

        String targetStatus = status;
        lead.setStatus(targetStatus);
        
        if ("Converted".equalsIgnoreCase(targetStatus) && lead.getCampaign() != null) {
            Campaign c = lead.getCampaign();
            c.setConversions(c.getConversions() + 1);
            campaignRepository.save(c);
        }

        Lead saved = leadRepository.save(lead);
        LeadDto resultDto = convertToDto(saved);
        webSocketManager.broadcastLead(user.getWorkspace().getId(), resultDto);
        return resultDto;
    }

    @Transactional
    public LeadDto assignLead(Long leadId, Long userId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new IllegalArgumentException("Lead not found"));

        User assignTarget = null;
        String algorithmDetails = null;

        if (userId == -1) {
            assignTarget = findBestLeadAssignee(user.getWorkspace());
            if (assignTarget != null) {
                algorithmDetails = "Assigned via Hybrid Auto-Assignment Lead Algorithm.";
            } else {
                throw new IllegalStateException("No eligible available team members to auto-assign this lead");
            }
        } else {
            assignTarget = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("Target user not found"));
            algorithmDetails = "Assigned manually by Administrator.";
        }

        lead.setAssignedTo(assignTarget);
        if (assignTarget != null && assignTarget.getId().equals(user.getId())) {
            lead.setQueueStatus("IN_PIPELINE");
        } else {
            lead.setQueueStatus("ASSIGNED");
        }
        if (assignTarget != null && assignTarget.getWorkspace() != null) {
            lead.setWorkspace(assignTarget.getWorkspace());
        }
        Lead saved = leadRepository.save(lead);

        assignTarget.setLastAssignedAt(LocalDateTime.now());
        userRepository.save(assignTarget);

        // Log assignment
        leadAssignmentRepository.save(new LeadAssignment(saved, assignTarget));
        assignmentLogRepository.save(new AssignmentLog(
                user.getWorkspace(), "LEAD", saved.getId(), assignTarget, algorithmDetails
        ));

        // Notify
        createAndSendNotification(assignTarget, "New Lead Assigned", 
                "You have been assigned to lead: \"" + saved.getName() + "\" (Lead #" + saved.getId() + ").");

        LeadDto resultDto = convertToDto(saved);
        webSocketManager.broadcastLead(user.getWorkspace().getId(), resultDto);
        return resultDto;
    }

    @Transactional
    public List<LeadDto> bulkAssignLeads(List<Long> leadIds, Long userId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        List<LeadDto> updated = new ArrayList<>();
        for (Long id : leadIds) {
            Lead lead = leadRepository.findById(id).orElse(null);
            if (lead != null && lead.getWorkspace().getId().equals(user.getWorkspace().getId())) {
                User assignTarget = userId == -1
                        ? findBestLeadAssignee(user.getWorkspace())
                        : userRepository.findById(userId).orElse(null);
                
                if (assignTarget != null) {
                    lead.setAssignedTo(assignTarget);
                    lead.setQueueStatus("ASSIGNED");
                    if (assignTarget.getWorkspace() != null) {
                        lead.setWorkspace(assignTarget.getWorkspace());
                    }
                    Lead saved = leadRepository.save(lead);

                    assignTarget.setLastAssignedAt(LocalDateTime.now());
                    userRepository.save(assignTarget);

                    leadAssignmentRepository.save(new LeadAssignment(saved, assignTarget));
                    assignmentLogRepository.save(new AssignmentLog(
                            user.getWorkspace(), "LEAD", saved.getId(), assignTarget, "Bulk auto-assignment."
                    ));

                    createAndSendNotification(assignTarget, "New Lead Assigned", 
                            "You have been assigned to lead: \"" + saved.getName() + "\" via bulk assignment.");

                    updated.add(convertToDto(saved));
                }
            }
        }
        return updated;
    }

    @Transactional
    public List<LeadDto> bulkRandomAssignLeads(List<Long> leadIds, String userEmail) {
        return bulkAssignLeads(leadIds, -1L, userEmail);
    }

    @Transactional
    public List<LeadDto> bulkUpdateLeadStatus(List<Long> leadIds, String status, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        List<LeadDto> updated = new ArrayList<>();
        for (Long id : leadIds) {
            Lead lead = leadRepository.findById(id).orElse(null);
            if (lead != null && lead.getWorkspace().getId().equals(user.getWorkspace().getId())) {
                lead.setStatus(status);
                
                if ("Converted".equalsIgnoreCase(status) && lead.getCampaign() != null) {
                    Campaign c = lead.getCampaign();
                    c.setConversions(c.getConversions() + 1);
                    campaignRepository.save(c);
                }
                Lead saved = leadRepository.save(lead);
                updated.add(convertToDto(saved));
            }
        }
        return updated;
    }

    @Transactional
    public void addNote(Long leadId, LeadNoteRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new IllegalArgumentException("Lead not found"));

        boolean isUserOnly = user.getRoles().stream()
                .anyMatch(r -> r.getName().equals("ROLE_USER")) &&
                user.getRoles().stream().noneMatch(r -> r.getName().equals("ROLE_ADMIN") || r.getName().equals("ROLE_MANAGER"));

        if (isUserOnly && (lead.getAssignedTo() == null || !lead.getAssignedTo().getId().equals(user.getId()))) {
            throw new IllegalStateException("You cannot add notes to a lead not assigned to you");
        }

        LeadNote note = LeadNote.builder()
                .lead(lead)
                .user(user)
                .note(request.getNote())
                .build();

        leadNoteRepository.save(note);
    }

    public List<LeadNote> getNotes(Long leadId) {
        return leadNoteRepository.findByLeadIdOrderByCreatedAtDesc(leadId);
    }

    public LeadDto getLeadById(Long leadId) {
        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new IllegalArgumentException("Lead not found"));
        return convertToDto(lead);
    }

    public User findBestLeadAssignee(Workspace workspace) {
        List<User> members = userRepository.findByWorkspaceId(workspace.getId());
        List<User> activeMembers = members.stream()
                .filter(u -> !"SUSPENDED".equalsIgnoreCase(u.getStatus()))
                .collect(Collectors.toList());

        if (activeMembers.isEmpty()) {
            return null;
        }

        // Step 1: Availability Check
        List<User> eligibleUsers = new ArrayList<>();
        for (User u : activeMembers) {
            String avail = u.getAvailabilityStatus();
            if ("AVAILABLE".equalsIgnoreCase(avail)) {
                eligibleUsers.add(u);
            } else if ("BUSY".equalsIgnoreCase(avail)) {
                // Workload threshold for leads: max 10 active leads
                long activeLeads = leadRepository.countByAssignedToAndStatusIn(u, 
                        List.of("New", "Contacted", "Qualified", "NEW", "CONTACTED", "QUALIFIED"));
                if (activeLeads < 10) {
                    eligibleUsers.add(u);
                }
            }
        }

        if (eligibleUsers.isEmpty()) {
            return null;
        }

        // Step 2: Least Workload
        long minWorkload = Long.MAX_VALUE;
        List<User> minWorkloadUsers = new ArrayList<>();

        for (User u : eligibleUsers) {
            long workload = leadRepository.countByAssignedToAndStatusIn(u, 
                    List.of("New", "Contacted", "Qualified", "NEW", "CONTACTED", "QUALIFIED"));
            if (workload < minWorkload) {
                minWorkload = workload;
                minWorkloadUsers.clear();
                minWorkloadUsers.add(u);
            } else if (workload == minWorkload) {
                minWorkloadUsers.add(u);
            }
        }

        // Step 3: Round Robin Fallback
        if (minWorkloadUsers.size() == 1) {
            return minWorkloadUsers.get(0);
        }

        User bestUser = minWorkloadUsers.get(0);
        LocalDateTime oldestTime = LocalDateTime.now();
        for (User u : minWorkloadUsers) {
            if (u.getLastAssignedAt() == null) {
                bestUser = u;
                break;
            } else if (u.getLastAssignedAt().isBefore(oldestTime)) {
                oldestTime = u.getLastAssignedAt();
                bestUser = u;
            }
        }

        return bestUser;
    }

    private void createAndSendNotification(User recipient, String title, String message) {
        if (recipient == null) return;
        Notification notification = Notification.builder()
                .user(recipient)
                .title(title)
                .message(message)
                .isRead(false)
                .build();
        notificationRepository.save(notification);

        Map<String, Object> wsMsg = new HashMap<>();
        wsMsg.put("id", notification.getId());
        wsMsg.put("title", notification.getTitle());
        wsMsg.put("message", notification.getMessage());
        wsMsg.put("isRead", notification.getIsRead());
        wsMsg.put("createdAt", LocalDateTime.now().toString());

        webSocketManager.broadcastNotification(recipient.getId(), wsMsg);
        webSocketManager.broadcastWorkspaceNotification(recipient.getWorkspace().getId(), wsMsg);
    }

    public void ensureDefaultSalesActivities(Lead lead) {
        List<SalesActivity> existing = salesActivityRepository.findByLeadIdOrderByIdAsc(lead.getId());
        if (existing.isEmpty()) {
            List<SalesActivity> defaults = List.of(
                new SalesActivity(lead, "FIRST_CALL", "First Call", "PENDING"),
                new SalesActivity(lead, "REQUIREMENT_COLLECTION", "Requirement Collection", "PENDING"),
                new SalesActivity(lead, "DEMO_SCHEDULED", "Demo Scheduled", "PENDING"),
                new SalesActivity(lead, "PROPOSAL_SENT", "Proposal Sent", "PENDING"),
                new SalesActivity(lead, "NEGOTIATION", "Negotiation", "PENDING"),
                new SalesActivity(lead, "CLOSING", "Closing", "PENDING"),
                new SalesActivity(lead, "PAYMENT_FOLLOWUP", "Payment Follow-up", "PENDING")
            );
            salesActivityRepository.saveAll(defaults);
        }
    }

    @Transactional
    public LeadDto updateLeadActivity(Long leadId, String activityKey, String status, String remarks, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new IllegalArgumentException("Lead not found: " + leadId));

        ensureDefaultSalesActivities(lead);

        final String normalizedKey = normalizeActivityKey(activityKey);
        SalesActivity activity = salesActivityRepository.findByLeadIdAndActivityKey(leadId, normalizedKey)
                .orElseGet(() -> new SalesActivity(lead, normalizedKey, normalizedKey.replace("_", " "), "PENDING"));

        String oldStatus = activity.getStatus();
        activity.setStatus(status);
        if (remarks != null) {
            activity.setRemarks(remarks);
        }
        if ("COMPLETED".equalsIgnoreCase(status)) {
            activity.setCompletedAt(LocalDateTime.now());
            activity.setCompletedBy(user);
        }
        salesActivityRepository.save(activity);

        // Recalculate Lead Progress %
        List<SalesActivity> activities = salesActivityRepository.findByLeadIdOrderByIdAsc(leadId);
        long completedCount = activities.stream().filter(a -> "COMPLETED".equalsIgnoreCase(a.getStatus())).count();
        int progress = (int) Math.round(((double) completedCount / activities.size()) * 100);
        lead.setProgressPercentage(progress);

        // Auto-advance stage based on activity progress
        if ("FIRST_CALL".equals(activityKey) && "COMPLETED".equals(status) && "New".equalsIgnoreCase(lead.getStatus())) {
            lead.setStatus("Contacted");
        } else if ("PROPOSAL_SENT".equals(activityKey) && "COMPLETED".equals(status)) {
            lead.setStatus("Proposal Sent");
        } else if ("NEGOTIATION".equals(activityKey) && "COMPLETED".equals(status)) {
            lead.setStatus("Negotiation");
        } else if ("CLOSING".equals(activityKey) && "COMPLETED".equals(status)) {
            lead.setStatus("Converted");
        }
        leadRepository.save(lead);

        // Log timeline history
        LeadHistory history = new LeadHistory(
                lead,
                "ACTIVITY_UPDATE",
                "Activity '" + activity.getTitle() + "' updated to " + status + (remarks != null && !remarks.isBlank() ? " (Remarks: " + remarks + ")" : ""),
                user,
                oldStatus,
                status
        );
        leadHistoryRepository.save(history);

        return convertToDto(lead);
    }

    @Transactional
    public LeadDto addStepActivityLog(Long leadId, String activityKey, AddActivityLogRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new IllegalArgumentException("Lead not found: " + leadId));

        ensureDefaultSalesActivities(lead);

        final String normalizedKey = normalizeActivityKey(activityKey);
        SalesActivity activity = salesActivityRepository.findByLeadIdAndActivityKey(leadId, normalizedKey)
                .orElseGet(() -> new SalesActivity(lead, normalizedKey, normalizedKey.replace("_", " "), "PENDING"));

        if ("PENDING".equalsIgnoreCase(activity.getStatus())) {
            activity.setStatus("IN_PROGRESS");
        }
        activity = salesActivityRepository.save(activity);

        List<SalesActivityLog> existingLogs = salesActivityLogRepository.findBySalesActivityIdOrderByActivityNumberAsc(activity.getId());
        int nextActivityNumber = existingLogs.size() + 1;

        SalesActivityLog activityLog = new SalesActivityLog(
                activity,
                lead,
                nextActivityNumber,
                request.getCommunicationType() != null ? request.getCommunicationType() : "PHONE_CALL",
                request.getOutcome() != null ? request.getOutcome() : "ATTEMPTED",
                request.getRemarks(),
                request.getDuration(),
                request.getStatus() != null ? request.getStatus() : "ATTEMPTED",
                request.getNextFollowupDate(),
                request.getAttachments(),
                user
        );
        salesActivityLogRepository.save(activityLog);

        if (request.getRemarks() != null && !request.getRemarks().isBlank()) {
            activity.setRemarks(request.getRemarks());
        }
        salesActivityRepository.save(activity);

        // Follow-up Integration: Auto-create FollowupReminder if nextFollowupDate is provided
        if (request.getNextFollowupDate() != null) {
            User assignedUser = lead.getAssignedTo() != null ? lead.getAssignedTo() : user;
            Workspace workspace = user.getWorkspace() != null ? user.getWorkspace() : assignedUser.getWorkspace();
            if (workspace != null) {
                String followupType = "CALL";
                if ("WHATSAPP".equalsIgnoreCase(request.getCommunicationType())) followupType = "WHATSAPP";
                else if ("EMAIL".equalsIgnoreCase(request.getCommunicationType())) followupType = "EMAIL";
                else if ("GOOGLE_MEET".equalsIgnoreCase(request.getCommunicationType()) || "ZOOM".equalsIgnoreCase(request.getCommunicationType()) || "OFFICE_VISIT".equalsIgnoreCase(request.getCommunicationType())) followupType = "MEETING";

                String notes = "Follow-up created from Workflow Step '" + activity.getTitle() + "' (Attempt #" + nextActivityNumber + "): " + (request.getRemarks() != null ? request.getRemarks() : "Follow-up required");
                FollowupReminder reminder = new FollowupReminder(lead, assignedUser, workspace, request.getNextFollowupDate(), followupType, notes);
                followupRepository.save(reminder);
            }
        }

        // Timeline Audit History
        LeadHistory history = new LeadHistory(
                lead,
                "ACTIVITY_LOG_ADDED",
                "Logged Activity #" + nextActivityNumber + " (" + activityLog.getCommunicationType() + " - Outcome: " + activityLog.getOutcome() + ") for step '" + activity.getTitle() + "'" + (request.getRemarks() != null && !request.getRemarks().isBlank() ? ": " + request.getRemarks() : ""),
                user,
                activity.getStatus(),
                activity.getStatus()
        );
        leadHistoryRepository.save(history);

        return convertToDto(lead);
    }

    @Transactional
    public LeadDto completeWorkflowStep(Long leadId, String activityKey, CompleteStepRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new IllegalArgumentException("Lead not found: " + leadId));

        ensureDefaultSalesActivities(lead);

        final String normalizedKey = normalizeActivityKey(activityKey);
        SalesActivity activity = salesActivityRepository.findByLeadIdAndActivityKey(leadId, normalizedKey)
                .orElseGet(() -> new SalesActivity(lead, normalizedKey, normalizedKey.replace("_", " "), "PENDING"));

        String oldStatus = activity.getStatus();
        activity.setStatus("COMPLETED");
        activity.setCompletedAt(LocalDateTime.now());
        activity.setCompletedBy(user);
        if (request != null && request.getCompletionRemarks() != null && !request.getCompletionRemarks().isBlank()) {
            activity.setCompletionRemarks(request.getCompletionRemarks());
            activity.setRemarks(request.getCompletionRemarks());
        }
        salesActivityRepository.save(activity);

        // Recalculate Lead Progress %
        List<SalesActivity> activities = salesActivityRepository.findByLeadIdOrderByIdAsc(leadId);
        long completedCount = activities.stream().filter(a -> "COMPLETED".equalsIgnoreCase(a.getStatus())).count();
        int progress = (int) Math.round(((double) completedCount / activities.size()) * 100);
        lead.setProgressPercentage(progress);

        // Auto-advance stage based on completed step
        if ("FIRST_CALL".equals(activityKey) && "New".equalsIgnoreCase(lead.getStatus())) {
            lead.setStatus("Contacted");
        } else if ("REQUIREMENT_COLLECTION".equals(activityKey)) {
            lead.setStatus("Interested");
        } else if ("DEMO_SCHEDULED".equals(activityKey)) {
            lead.setStatus("Qualified");
        } else if ("PROPOSAL_SENT".equals(activityKey)) {
            lead.setStatus("Proposal Sent");
        } else if ("NEGOTIATION".equals(activityKey)) {
            lead.setStatus("Negotiation");
        } else if ("CLOSING".equals(activityKey)) {
            lead.setStatus("Converted");
        } else if ("PAYMENT_FOLLOWUP".equals(activityKey)) {
            lead.setStatus("Payment Completed");
        }
        leadRepository.save(lead);

        // Timeline Audit History
        LeadHistory history = new LeadHistory(
                lead,
                "STEP_COMPLETED",
                "Explicitly marked step '" + activity.getTitle() + "' as COMPLETED" + (activity.getCompletionRemarks() != null ? " (Remark: " + activity.getCompletionRemarks() + ")" : ""),
                user,
                oldStatus,
                "COMPLETED"
        );
        leadHistoryRepository.save(history);

        // Send WebSocket Notification to Manager/Workspace
        if (user.getWorkspace() != null) {
            Map<String, Object> wsMsg = new HashMap<>();
            wsMsg.put("type", "WORKFLOW_STEP_COMPLETED");
            wsMsg.put("leadId", lead.getId());
            wsMsg.put("leadName", lead.getName());
            wsMsg.put("stepTitle", activity.getTitle());
            wsMsg.put("completedByName", user.getFullName());
            wsMsg.put("timestamp", LocalDateTime.now().toString());
            webSocketManager.broadcastWorkspaceNotification(user.getWorkspace().getId(), wsMsg);
        }

        return convertToDto(lead);
    }

    public List<SalesActivityLogDto> getLeadActivityLogs(Long leadId) {
        List<SalesActivityLog> logs = salesActivityLogRepository.findByLeadIdOrderByCreatedAtDesc(leadId);
        return logs.stream().map(log -> new SalesActivityLogDto(
                log.getId(),
                log.getSalesActivity() != null ? log.getSalesActivity().getId() : null,
                log.getLead().getId(),
                log.getActivityNumber(),
                log.getCommunicationType(),
                log.getOutcome(),
                log.getRemarks(),
                log.getDuration(),
                log.getStatus(),
                log.getNextFollowupDate(),
                log.getAttachments(),
                log.getLoggedBy() != null ? log.getLoggedBy().getId() : null,
                log.getLoggedBy() != null ? log.getLoggedBy().getFullName() : "System",
                log.getCreatedAt()
        )).collect(Collectors.toList());
    }

    public Map<String, Integer> getWorkflowPendingCounts(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        List<Lead> leads;
        if (user.getRoles().contains("ROLE_ADMIN") || user.getRoles().contains("ROLE_MANAGER")) {
            leads = leadRepository.findByWorkspaceIdOrderByCreatedAtDesc(user.getWorkspace().getId());
        } else {
            leads = leadRepository.findByAssignedToIdOrderByCreatedAtDesc(user.getId());
        }

        Map<String, Integer> pendingCounts = new HashMap<>();
        pendingCounts.put("pendingFirstCalls", 0);
        pendingCounts.put("pendingRequirementCollection", 0);
        pendingCounts.put("pendingDemo", 0);
        pendingCounts.put("pendingProposal", 0);
        pendingCounts.put("pendingNegotiation", 0);
        pendingCounts.put("pendingPayment", 0);

        for (Lead lead : leads) {
            List<SalesActivity> activities = salesActivityRepository.findByLeadIdOrderByIdAsc(lead.getId());
            for (SalesActivity act : activities) {
                if (!"COMPLETED".equalsIgnoreCase(act.getStatus())) {
                    switch (act.getActivityKey()) {
                        case "FIRST_CALL":
                            pendingCounts.put("pendingFirstCalls", pendingCounts.get("pendingFirstCalls") + 1);
                            break;
                        case "REQUIREMENT_COLLECTION":
                            pendingCounts.put("pendingRequirementCollection", pendingCounts.get("pendingRequirementCollection") + 1);
                            break;
                        case "DEMO_SCHEDULED":
                            pendingCounts.put("pendingDemo", pendingCounts.get("pendingDemo") + 1);
                            break;
                        case "PROPOSAL_SENT":
                            pendingCounts.put("pendingProposal", pendingCounts.get("pendingProposal") + 1);
                            break;
                        case "NEGOTIATION":
                            pendingCounts.put("pendingNegotiation", pendingCounts.get("pendingNegotiation") + 1);
                            break;
                        case "PAYMENT_FOLLOWUP":
                            pendingCounts.put("pendingPayment", pendingCounts.get("pendingPayment") + 1);
                            break;
                    }
                }
            }
        }
        return pendingCounts;
    }

    @Transactional
    public LeadDto updateLeadWorkspace(Long leadId, LeadDto updateDto, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new IllegalArgumentException("Lead not found: " + leadId));

        String oldStatus = lead.getStatus();
        if (updateDto.getStatus() != null && !updateDto.getStatus().isBlank()) {
            lead.setStatus(updateDto.getStatus());
        }
        if (updateDto.getCompany() != null) lead.setCompany(updateDto.getCompany());
        if (updateDto.getLocation() != null) lead.setLocation(updateDto.getLocation());
        if (updateDto.getPriority() != null) lead.setPriority(updateDto.getPriority());
        if (updateDto.getClientNotes() != null) lead.setClientNotes(updateDto.getClientNotes());
        if (updateDto.getProposalAmount() != null) lead.setProposalAmount(updateDto.getProposalAmount());
        if (updateDto.getProposalStatus() != null) lead.setProposalStatus(updateDto.getProposalStatus());
        if (updateDto.getProgressPercentage() != null) lead.setProgressPercentage(updateDto.getProgressPercentage());

        leadRepository.save(lead);

        // Log change history
        String desc = "Workspace auto-saved/updated.";
        if (updateDto.getStatus() != null && !updateDto.getStatus().equals(oldStatus)) {
            desc = "Lead status transitioned from " + oldStatus + " to " + updateDto.getStatus();
        }
        LeadHistory history = new LeadHistory(lead, "WORKSPACE_UPDATE", desc, user, oldStatus, lead.getStatus());
        leadHistoryRepository.save(history);

        return convertToDto(lead);
    }

    public List<LeadHistoryDto> getLeadTimeline(Long leadId) {
        List<LeadHistory> list = leadHistoryRepository.findByLeadIdOrderByTimestampDesc(leadId);
        return list.stream().map(h -> new LeadHistoryDto(
                h.getId(),
                h.getLead().getId(),
                h.getAction(),
                h.getDescription(),
                h.getPerformedBy() != null ? h.getPerformedBy().getId() : null,
                h.getPerformedBy() != null ? h.getPerformedBy().getFullName() : "System",
                h.getPreviousStatus(),
                h.getNewStatus(),
                h.getTimestamp()
        )).collect(Collectors.toList());
    }

    private LeadDto convertToDto(Lead lead) {
        ensureDefaultSalesActivities(lead);

        List<SalesActivity> activities = salesActivityRepository.findByLeadIdOrderByIdAsc(lead.getId());
        List<SalesActivityDto> activityDtos = activities.stream().map(a -> {
            List<SalesActivityLog> logs = salesActivityLogRepository.findBySalesActivityIdOrderByActivityNumberAsc(a.getId());
            List<SalesActivityLogDto> logDtos = logs.stream().map(l -> new SalesActivityLogDto(
                    l.getId(),
                    a.getId(),
                    lead.getId(),
                    l.getActivityNumber(),
                    l.getCommunicationType(),
                    l.getOutcome(),
                    l.getRemarks(),
                    l.getDuration(),
                    l.getStatus(),
                    l.getNextFollowupDate(),
                    l.getAttachments(),
                    l.getLoggedBy() != null ? l.getLoggedBy().getId() : null,
                    l.getLoggedBy() != null ? l.getLoggedBy().getFullName() : "System",
                    l.getCreatedAt()
            )).collect(Collectors.toList());

            return new SalesActivityDto(
                    a.getId(),
                    lead.getId(),
                    a.getActivityKey(),
                    a.getTitle(),
                    a.getStatus(),
                    a.getCompletedAt(),
                    a.getCompletedBy() != null ? a.getCompletedBy().getId() : null,
                    a.getCompletedBy() != null ? a.getCompletedBy().getFullName() : null,
                    a.getCompletionRemarks(),
                    a.getRemarks(),
                    a.getCreatedAt(),
                    logDtos
            );
        }).collect(Collectors.toList());

        LeadDto dto = new LeadDto();
        dto.setId(lead.getId());
        dto.setName(lead.getName());
        dto.setEmail(lead.getEmail());
        dto.setPhone(lead.getPhone());
        dto.setSourcePlatform(lead.getSourcePlatform());
        dto.setCampaignName(lead.getCampaignName());
        dto.setCampaignId(lead.getCampaign() != null ? lead.getCampaign().getId() : null);
        dto.setStatus(lead.getStatus());
        dto.setAssignedToId(lead.getAssignedTo() != null ? lead.getAssignedTo().getId() : null);
        dto.setAssignedToName(lead.getAssignedTo() != null ? lead.getAssignedTo().getFullName() : "Unassigned");
        dto.setQualityScore(lead.getQualityScore() != null ? lead.getQualityScore() : 75);
        dto.setQualityTier(lead.getQualityTier() != null ? lead.getQualityTier() : "WARM");
        dto.setConversionProbability(lead.getConversionProbability() != null ? lead.getConversionProbability() : 75.0);
        dto.setQueueStatus(lead.getQueueStatus() != null ? lead.getQueueStatus() : (lead.getAssignedTo() != null ? "ASSIGNED" : "IN_QUEUE"));

        dto.setCompany(lead.getCompany() != null ? lead.getCompany() : "N/A");
        dto.setLocation(lead.getLocation() != null ? lead.getLocation() : "Remote / Unspecified");
        dto.setPriority(lead.getPriority() != null ? lead.getPriority() : "MEDIUM");
        dto.setAssignedByName(lead.getAssignedBy() != null ? lead.getAssignedBy().getFullName() : "System Queue");
        dto.setAssignedDate(lead.getAssignedDate() != null ? lead.getAssignedDate() : lead.getCreatedAt());
        dto.setProgressPercentage(lead.getProgressPercentage() != null ? lead.getProgressPercentage() : 0);
        dto.setLastFollowupDate(lead.getLastFollowupDate());
        dto.setDueDate(lead.getDueDate());
        dto.setClientNotes(lead.getClientNotes());
        dto.setProposalAmount(lead.getProposalAmount());
        dto.setProposalStatus(lead.getProposalStatus());
        dto.setActivities(activityDtos);
        dto.setCreatedAt(lead.getCreatedAt());

        return dto;
    }

    @Transactional
    public LeadDto addToPipeline(Long leadId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new IllegalArgumentException("Lead not found with id: " + leadId));

        if (lead.getAssignedTo() == null) {
            lead.setAssignedTo(user);
        }
        lead.setQueueStatus("IN_PIPELINE");
        if (lead.getWorkspace() == null && user.getWorkspace() != null) {
            lead.setWorkspace(user.getWorkspace());
        }
        Lead saved = leadRepository.save(lead);

        LeadDto resultDto = convertToDto(saved);
        try {
            if (user.getWorkspace() != null) {
                webSocketManager.broadcastLead(user.getWorkspace().getId(), resultDto);
            }
        } catch (Exception e) {
            System.err.println("Failed to broadcast lead update via WebSocket: " + e.getMessage());
        }
        return resultDto;
    }

    public List<LeadDto> getPipelineLeads(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        if (user.getWorkspace() == null) {
            throw new IllegalStateException("User does not belong to a workspace");
        }

        boolean isUserOnly = user.getRoles().stream()
                .anyMatch(r -> r.getName().equalsIgnoreCase("ROLE_USER") || r.getName().equalsIgnoreCase("USER")) &&
                user.getRoles().stream().noneMatch(r -> r.getName().equalsIgnoreCase("ROLE_ADMIN") || r.getName().equalsIgnoreCase("ADMIN") || r.getName().equalsIgnoreCase("ROLE_MANAGER") || r.getName().equalsIgnoreCase("MANAGER"));

        List<Lead> leads;
        if (isUserOnly) {
            leads = leadRepository.findPipelineLeadsByUserId(user.getId());
        } else {
            leads = leadRepository.findPipelineLeadsByWorkspaceId(user.getWorkspace().getId());
            if (leads.isEmpty()) {
                leads = leadRepository.findByWorkspaceIdOrderByCreatedAtDesc(user.getWorkspace().getId());
            }
        }

        return leads.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    public List<LeadDto> getPendingAssignedLeads(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        List<Lead> leads = leadRepository.findPendingAssignedLeadsByUserId(user.getId());
        return leads.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    private String normalizeActivityKey(String key) {
        if (key == null) return "FIRST_CALL";
        String normalized = key.toUpperCase().trim().replace(" ", "_");
        if ("CONTACTED".equals(normalized) || "FIRSTCALL".equals(normalized) || "FIRST_CALL".equals(normalized)) return "FIRST_CALL";
        if ("REQUIREMENT".equals(normalized) || "REQUIREMENTS".equals(normalized) || "REQUIREMENT_COLLECTION".equals(normalized) || "FOLLOW_UP".equals(normalized) || "FOLLOWUP".equals(normalized)) return "REQUIREMENT_COLLECTION";
        if ("DEMO".equals(normalized) || "DEMOSCHEDULED".equals(normalized) || "DEMO_SCHEDULED".equals(normalized)) return "DEMO_SCHEDULED";
        if ("PROPOSAL".equals(normalized) || "PROPOSALSENT".equals(normalized) || "PROPOSAL_SENT".equals(normalized)) return "PROPOSAL_SENT";
        if ("NEGOTIATION".equals(normalized)) return "NEGOTIATION";
        if ("CLOSING".equals(normalized) || "CONVERTED".equals(normalized)) return "CLOSING";
        if ("PAYMENT".equals(normalized) || "PAYMENT_COMPLETED".equals(normalized) || "PAYMENT_FOLLOWUP".equals(normalized)) return "PAYMENT_FOLLOWUP";
        return normalized;
    }
}
