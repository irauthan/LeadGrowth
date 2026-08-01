package com.leadgrowth.service;

import com.leadgrowth.dto.ContactRepoDto;
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
import com.leadgrowth.entity.LeadAssignmentHistory;
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
    private final LeadAssignmentHistoryRepository leadAssignmentHistoryRepository;

    private final LeadActivityRepository leadActivityRepository;

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
            FollowupRepository followupRepository,
            LeadAssignmentHistoryRepository leadAssignmentHistoryRepository,
            LeadActivityRepository leadActivityRepository
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
        this.leadAssignmentHistoryRepository = leadAssignmentHistoryRepository;
        this.leadActivityRepository = leadActivityRepository;
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
            validateLeadAssigneeRole(assignedTo);
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

    private int calculateProgressPercentage(String status) {
        if (status == null) return 10;
        switch (status.trim().toLowerCase()) {
            case "new":
            case "new lead":
                return 10;
            case "interaction":
            case "contacted":
                return 25;
            case "qualified":
                return 50;
            case "meeting scheduled":
            case "demo scheduled":
                return 65;
            case "proposal sent":
            case "proposal":
                return 80;
            case "negotiation":
            case "negotiation started":
                return 90;
            case "converted":
            case "closed won":
            case "won":
                return 100;
            case "rejected":
            case "closed lost":
            case "lost":
                return 0;
            default:
                return 25;
        }
    }

    @Transactional
    public LeadDto updateStatus(Long leadId, String status, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new IllegalArgumentException("Lead not found"));

        boolean isUserOnly = user.getRoles().stream()
                .anyMatch(r -> r.getName().equalsIgnoreCase("ROLE_USER") || r.getName().equalsIgnoreCase("USER")) &&
                user.getRoles().stream().noneMatch(r -> r.getName().equalsIgnoreCase("ROLE_ADMIN") || r.getName().equalsIgnoreCase("ADMIN") || r.getName().equalsIgnoreCase("ROLE_MANAGER") || r.getName().equalsIgnoreCase("MANAGER"));

        if (isUserOnly && (lead.getAssignedTo() == null || !lead.getAssignedTo().getId().equals(user.getId()))) {
            throw new IllegalStateException("You are not authorized to update this lead's status");
        }

        String oldStatus = lead.getStatus() != null ? lead.getStatus() : "New Lead";
        String targetStatus = status;
        lead.setStatus(targetStatus);
        lead.setProgressPercentage(calculateProgressPercentage(targetStatus));
        
        if (("Converted".equalsIgnoreCase(targetStatus) || "Closed Won".equalsIgnoreCase(targetStatus)) && lead.getCampaign() != null) {
            Campaign c = lead.getCampaign();
            c.setConversions(c.getConversions() + 1);
            campaignRepository.save(c);
        }

        Lead saved = leadRepository.save(lead);

        // Record history & timeline activity
        try {
            leadHistoryRepository.save(new LeadHistory(saved, "STAGE_CHANGE", "Stage updated from '" + oldStatus + "' to '" + targetStatus + "'", user, oldStatus, targetStatus));
            leadActivityRepository.save(new com.leadgrowth.entity.LeadActivity(saved, user, user.getWorkspace(), "STAGE_CHANGE", "Stage Changed to " + targetStatus, "Moved stage from '" + oldStatus + "' to '" + targetStatus + "'"));
        } catch (Exception e) {
            // Ignore non-fatal logging exceptions
        }

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
            validateLeadAssigneeRole(assignTarget);
            algorithmDetails = "Assigned manually by Administrator.";
        }

        User oldOwner = lead.getAssignedTo();
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

        // Log assignment & audit history
        leadAssignmentRepository.save(new LeadAssignment(saved, assignTarget));
        leadAssignmentHistoryRepository.save(new LeadAssignmentHistory(saved, oldOwner, assignTarget, user, algorithmDetails));
        assignmentLogRepository.save(new AssignmentLog(
                user.getWorkspace(), "LEAD", saved.getId(), assignTarget, algorithmDetails
        ));

        // Real-Time Notifications
        createAndSendNotification(assignTarget, "New Lead Assigned", 
                "You are now the sole active owner of lead: \"" + saved.getName() + "\" (Lead #" + saved.getId() + ").");

        if (oldOwner != null && !oldOwner.getId().equals(assignTarget.getId())) {
            createAndSendNotification(oldOwner, "Lead Reassigned", 
                    "Lead \"" + saved.getName() + "\" (Lead #" + saved.getId() + ") has been reassigned to " + assignTarget.getFullName() + ".");
            try {
                Map<String, Object> wsMsg = new HashMap<>();
                wsMsg.put("type", "LEAD_REMOVED");
                wsMsg.put("leadId", saved.getId());
                webSocketManager.broadcastNotification(oldOwner.getId(), wsMsg);
            } catch (Exception ignored) {}
        }

        LeadDto resultDto = convertToDto(saved);
        webSocketManager.broadcastLead(user.getWorkspace().getId(), resultDto);
        try {
            Map<String, Object> wsAssignMsg = new HashMap<>();
            wsAssignMsg.put("type", "LEAD_ASSIGNED");
            wsAssignMsg.put("lead", resultDto);
            webSocketManager.broadcastNotification(assignTarget.getId(), wsAssignMsg);
        } catch (Exception ignored) {}
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

    private void validateLeadAssigneeRole(User targetUser) {
        if (targetUser == null) return;
        boolean isAdminOrManager = targetUser.getRoles().stream().anyMatch(r -> 
            "ROLE_ADMIN".equalsIgnoreCase(r.getName()) || "ADMIN".equalsIgnoreCase(r.getName()) || 
            "ROLE_MANAGER".equalsIgnoreCase(r.getName()) || "MANAGER".equalsIgnoreCase(r.getName()));
        if (isAdminOrManager) {
            throw new IllegalArgumentException("Leads can only be assigned to Sales Executives (ROLE_USER). Admin and Manager accounts cannot be assigned leads.");
        }
    }

    public User findBestLeadAssignee(Workspace workspace) {
        List<User> members = userRepository.findByWorkspaceId(workspace.getId());
        List<User> activeMembers = members.stream()
                .filter(u -> !"SUSPENDED".equalsIgnoreCase(u.getStatus()))
                .filter(u -> u.getRoles().stream().anyMatch(r -> "ROLE_USER".equalsIgnoreCase(r.getName()) || "USER".equalsIgnoreCase(r.getName())))
                .filter(u -> u.getRoles().stream().noneMatch(r -> "ROLE_ADMIN".equalsIgnoreCase(r.getName()) || "ADMIN".equalsIgnoreCase(r.getName()) || "ROLE_MANAGER".equalsIgnoreCase(r.getName()) || "MANAGER".equalsIgnoreCase(r.getName())))
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
                        List.of("New", "Interaction", "Contacted", "Qualified", "NEW", "INTERACTION", "CONTACTED", "QUALIFIED"));
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
                    List.of("New", "Interaction", "Contacted", "Qualified", "NEW", "INTERACTION", "CONTACTED", "QUALIFIED"));
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

    public void recalculateLeadProgress(Lead lead) {
        if (lead == null || lead.getId() == null) return;

        List<SalesActivity> activities = salesActivityRepository.findByLeadIdOrderByIdAsc(lead.getId());
        List<SalesActivity> activeActivities = activities.stream()
                .filter(a -> !"LEAD_LOST".equalsIgnoreCase(a.getActivityKey()) && !"LOST".equalsIgnoreCase(a.getActivityKey()))
                .collect(Collectors.toList());

        long completedActiveCount = activeActivities.stream()
                .filter(a -> "COMPLETED".equalsIgnoreCase(a.getStatus()))
                .count();

        int progress = 20;
        if (!activeActivities.isEmpty()) {
            progress = (int) Math.round(((double) completedActiveCount / activeActivities.size()) * 100);
        }

        String st = lead.getStatus() != null ? lead.getStatus() : "";
        if ("Converted".equalsIgnoreCase(st) || "Closed Won".equalsIgnoreCase(st) || "Negotiation".equalsIgnoreCase(st)) {
            progress = Math.max(progress, 100);
        } else if ("Proposal Sent".equalsIgnoreCase(st) || "Proposal".equalsIgnoreCase(st)) {
            progress = Math.max(progress, 80);
        } else if ("Qualified".equalsIgnoreCase(st) || "Demo Scheduled".equalsIgnoreCase(st) || "Interested".equalsIgnoreCase(st)) {
            progress = Math.max(progress, 60);
        } else if ("Contacted".equalsIgnoreCase(st) || "Interaction".equalsIgnoreCase(st) || "Follow-up".equalsIgnoreCase(st)) {
            progress = Math.max(progress, 40);
        } else if ("New".equalsIgnoreCase(st)) {
            progress = Math.max(progress, 20);
        }

        if ("Lost".equalsIgnoreCase(st) || "Rejected".equalsIgnoreCase(st)) {
            Integer existingProgress = lead.getProgressPercentage();
            if (existingProgress != null && existingProgress > 0) {
                progress = Math.max(progress, existingProgress);
            }
        }

        lead.setProgressPercentage(Math.min(100, Math.max(20, progress)));
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
                new SalesActivity(lead, "PAYMENT_FOLLOWUP", "Payment Follow-up", "PENDING"),
                new SalesActivity(lead, "LEAD_LOST", "Lead Lost / Dropped", "PENDING")
            );
            salesActivityRepository.saveAll(defaults);
        } else {
            boolean hasLostStep = existing.stream().anyMatch(a -> "LEAD_LOST".equalsIgnoreCase(a.getActivityKey()) || "LOST".equalsIgnoreCase(a.getActivityKey()));
            if (!hasLostStep) {
                salesActivityRepository.save(new SalesActivity(lead, "LEAD_LOST", "Lead Lost / Dropped", "PENDING"));
            }
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
        recalculateLeadProgress(lead);

        // Auto-advance stage based on activity progress
        if ("FIRST_CALL".equals(activityKey) && "COMPLETED".equals(status) && ("New".equalsIgnoreCase(lead.getStatus()) || "Contacted".equalsIgnoreCase(lead.getStatus()))) {
            lead.setStatus("Interaction");
        } else if ("PROPOSAL_SENT".equals(activityKey) && "COMPLETED".equals(status)) {
            lead.setStatus("Proposal Sent");
        } else if ("NEGOTIATION".equals(activityKey) && "COMPLETED".equals(status)) {
            lead.setStatus("Negotiation");
        } else if ("CLOSING".equals(activityKey) && "COMPLETED".equals(status)) {
            lead.setStatus("Converted");
        } else if (("LEAD_LOST".equals(activityKey) || "LOST".equals(activityKey)) && "COMPLETED".equals(status)) {
            lead.setStatus("Lost");
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

        if ("New".equalsIgnoreCase(lead.getStatus()) || "Contacted".equalsIgnoreCase(lead.getStatus())) {
            lead.setStatus("Interaction");
            leadRepository.save(lead);
        }

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
                FollowupReminder reminder = new FollowupReminder(lead, assignedUser, workspace, request.getNextFollowupDate(), followupType, notes, request.getOutcome(), request.getNextFollowupDate(), user);
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
        recalculateLeadProgress(lead);

        // Auto-advance stage based on completed step
        if ("FIRST_CALL".equals(activityKey) && ("New".equalsIgnoreCase(lead.getStatus()) || "Contacted".equalsIgnoreCase(lead.getStatus()))) {
            lead.setStatus("Interaction");
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
        } else if ("LEAD_LOST".equalsIgnoreCase(activityKey) || "LOST".equalsIgnoreCase(activityKey)) {
            lead.setStatus("Lost");
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

        // Synchronize Follow-up Details for Pipeline Cards & Views
        List<FollowupReminder> followups = followupRepository.findByLeadIdOrderByScheduledAtDesc(lead.getId());
        if (followups != null && !followups.isEmpty()) {
            FollowupReminder latestOrUpcoming = followups.stream()
                    .filter(f -> "UPCOMING".equalsIgnoreCase(f.getStatus()) || "PENDING".equalsIgnoreCase(f.getStatus()))
                    .findFirst()
                    .orElse(followups.get(0));

            LocalDateTime followupTime = latestOrUpcoming.getScheduledAt() != null ? latestOrUpcoming.getScheduledAt() : latestOrUpcoming.getNextFollowupDate();
            dto.setNextFollowupDate(followupTime);
            dto.setFollowupNotes(latestOrUpcoming.getNotes() != null ? latestOrUpcoming.getNotes() : latestOrUpcoming.getRemarks());
            dto.setFollowupType(latestOrUpcoming.getType() != null ? latestOrUpcoming.getType() : "CALL");
            dto.setFollowupStatus(latestOrUpcoming.getStatus());
            if (dto.getLastFollowupDate() == null) {
                dto.setLastFollowupDate(followupTime);
            }
        }

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

    public List<ContactRepoDto> getContactsRepository(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        
        List<Lead> leads;
        if (isUserOnly(user)) {
            leads = leadRepository.findByAssignedToIdOrderByCreatedAtDesc(user.getId());
        } else {
            leads = user.getWorkspace() != null 
                    ? leadRepository.findByWorkspaceIdOrderByCreatedAtDesc(user.getWorkspace().getId())
                    : leadRepository.findByAssignedToIdOrderByCreatedAtDesc(user.getId());
        }

        List<ContactRepoDto> contactList = new ArrayList<>();

        for (Lead lead : leads) {
            List<SalesActivityLog> logs = salesActivityLogRepository.findByLeadIdOrderByCreatedAtDesc(lead.getId());

            long calls = 0;
            long emails = 0;
            long whatsapp = 0;
            LocalDateTime firstContactDate = lead.getCreatedAt();
            LocalDateTime lastContactDate = lead.getCreatedAt();

            for (SalesActivityLog l : logs) {
                if (l.getCreatedAt() != null) {
                    if (firstContactDate == null || l.getCreatedAt().isBefore(firstContactDate)) {
                        firstContactDate = l.getCreatedAt();
                    }
                    if (lastContactDate == null || l.getCreatedAt().isAfter(lastContactDate)) {
                        lastContactDate = l.getCreatedAt();
                    }
                }

                String type = l.getCommunicationType() != null ? l.getCommunicationType().toUpperCase() : "";
                if (type.contains("CALL") || type.contains("PHONE")) {
                    calls++;
                } else if (type.contains("EMAIL")) {
                    emails++;
                } else if (type.contains("WHATSAPP")) {
                    whatsapp++;
                }
            }

            SalesActivityLog latest = !logs.isEmpty() ? logs.get(0) : null;
            String lastActivityDesc = latest != null 
                    ? (latest.getCommunicationType() != null ? latest.getCommunicationType() : "Interaction") + " (" + (latest.getOutcome() != null ? latest.getOutcome() : "Logged") + ")"
                    : "Pipeline Lead (" + (lead.getStatus() != null ? lead.getStatus() : "New") + ")";

            ContactRepoDto dto = new ContactRepoDto();
            dto.setLeadId(lead.getId());
            dto.setName(lead.getName());
            dto.setCompany(lead.getCompany() != null ? lead.getCompany() : "N/A");
            dto.setEmail(lead.getEmail());
            dto.setPhone(lead.getPhone());
            dto.setSourcePlatform(lead.getSourcePlatform());
            dto.setCurrentStage(lead.getStatus() != null ? lead.getStatus() : "New");
            if (lead.getAssignedTo() != null) {
                dto.setAssignedToId(lead.getAssignedTo().getId());
                dto.setAssignedToName(lead.getAssignedTo().getFullName());
            }
            dto.setQualityScore(lead.getQualityScore() != null ? lead.getQualityScore() : 75);
            dto.setQualityTier(lead.getQualityTier() != null ? lead.getQualityTier() : "WARM");
            dto.setConversionProbability(lead.getConversionProbability() != null ? lead.getConversionProbability() : 75.0);

            dto.setFirstContactDate(firstContactDate);
            dto.setLastContactDate(lastContactDate);
            dto.setTotalCalls(calls);
            dto.setTotalEmails(emails);
            dto.setTotalWhatsApp(whatsapp);
            dto.setTotalInteractionsCount(logs.size());
            dto.setLastActivityDescription(lastActivityDesc);
            dto.setCreatedAt(lead.getCreatedAt());

            contactList.add(dto);
        }

        return contactList;
    }

    private String normalizeActivityKey(String key) {
        if (key == null) return "FIRST_CALL";
        String normalized = key.toUpperCase().trim().replace(" ", "_");
        if ("INTERACTION".equals(normalized) || "CONTACTED".equals(normalized) || "FIRSTCALL".equals(normalized) || "FIRST_CALL".equals(normalized)) return "FIRST_CALL";
        if ("REQUIREMENT".equals(normalized) || "REQUIREMENTS".equals(normalized) || "REQUIREMENT_COLLECTION".equals(normalized) || "FOLLOW_UP".equals(normalized) || "FOLLOWUP".equals(normalized)) return "REQUIREMENT_COLLECTION";
        if ("DEMO".equals(normalized) || "DEMOSCHEDULED".equals(normalized) || "DEMO_SCHEDULED".equals(normalized)) return "DEMO_SCHEDULED";
        if ("PROPOSAL".equals(normalized) || "PROPOSALSENT".equals(normalized) || "PROPOSAL_SENT".equals(normalized)) return "PROPOSAL_SENT";
        if ("NEGOTIATION".equals(normalized)) return "NEGOTIATION";
        if ("CLOSING".equals(normalized) || "CONVERTED".equals(normalized)) return "CLOSING";
        if ("PAYMENT".equals(normalized) || "PAYMENT_COMPLETED".equals(normalized) || "PAYMENT_FOLLOWUP".equals(normalized)) return "PAYMENT_FOLLOWUP";
        if ("LEAD_LOST".equals(normalized) || "LOST".equals(normalized) || "DROP".equals(normalized) || "DROPPED".equals(normalized)) return "LEAD_LOST";
        return normalized;
    }

    private boolean isUserOnly(User user) {
        if (user == null || user.getRoles() == null || user.getRoles().isEmpty()) return true;
        return user.getRoles().stream().noneMatch(r -> {
            String name = r.getName() != null ? r.getName().toUpperCase() : "";
            return name.contains("ADMIN") || name.contains("MANAGER");
        });
    }

    public List<LeadDto> getHighPriorityLeads(String userEmail) {
        List<LeadDto> all = getLeads(userEmail);
        return all.stream()
                .filter(l -> "HIGH".equalsIgnoreCase(l.getPriority()) || "URGENT".equalsIgnoreCase(l.getPriority()) || "HOT".equalsIgnoreCase(l.getPriority()) || "P1_OVERDUE_FOLLOWUP".equalsIgnoreCase(l.getPriority()) || "P2_TODAY_NEGOTIATION".equalsIgnoreCase(l.getPriority()))
                .collect(Collectors.toList());
    }

    public List<LeadDto> getNewLeadsToday(String userEmail) {
        List<LeadDto> all = getLeads(userEmail);
        LocalDateTime startOfDay = LocalDateTime.now().with(java.time.LocalTime.MIN);
        return all.stream()
                .filter(l -> "New".equalsIgnoreCase(l.getStatus()) || (l.getCreatedAt() != null && l.getCreatedAt().isAfter(startOfDay)))
                .collect(Collectors.toList());
    }

    public List<LeadDto> getNegotiationLeads(String userEmail) {
        List<LeadDto> all = getLeads(userEmail);
        return all.stream()
                .filter(l -> "Negotiation".equalsIgnoreCase(l.getStatus()))
                .collect(Collectors.toList());
    }
}
