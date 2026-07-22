package com.leadgrowth.service;

import com.leadgrowth.dto.LeadDto;
import com.leadgrowth.dto.LeadNoteRequest;
import com.leadgrowth.entity.Campaign;
import com.leadgrowth.entity.Lead;
import com.leadgrowth.entity.LeadNote;
import com.leadgrowth.entity.User;
import com.leadgrowth.entity.LeadAssignment;
import com.leadgrowth.entity.AssignmentLog;
import com.leadgrowth.entity.Notification;
import com.leadgrowth.entity.Workspace;
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

    public LeadService(
            LeadRepository leadRepository,
            LeadNoteRepository leadNoteRepository,
            UserRepository userRepository,
            CampaignRepository campaignRepository,
            @Lazy WebSocketManager webSocketManager,
            LeadAssignmentRepository leadAssignmentRepository,
            AssignmentLogRepository assignmentLogRepository,
            NotificationRepository notificationRepository
    ) {
        this.leadRepository = leadRepository;
        this.leadNoteRepository = leadNoteRepository;
        this.userRepository = userRepository;
        this.campaignRepository = campaignRepository;
        this.webSocketManager = webSocketManager;
        this.leadAssignmentRepository = leadAssignmentRepository;
        this.assignmentLogRepository = assignmentLogRepository;
        this.notificationRepository = notificationRepository;
    }

    public List<LeadDto> getLeads(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        if (user.getWorkspace() == null) {
            throw new IllegalStateException("User does not belong to a workspace");
        }

        boolean isUserOnly = user.getRoles().stream()
                .anyMatch(r -> r.getName().equals("ROLE_USER")) &&
                user.getRoles().stream().noneMatch(r -> r.getName().equals("ROLE_ADMIN") || r.getName().equals("ROLE_MANAGER"));

        List<Lead> leads;
        if (isUserOnly) {
            leads = leadRepository.findByWorkspaceIdAndAssignedToIdOrderByCreatedAtDesc(
                    user.getWorkspace().getId(), user.getId()
            );
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
                "You have been assigned to lead: \"" + saved.getName() + "\".");

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

    private LeadDto convertToDto(Lead lead) {
        return LeadDto.builder()
                .id(lead.getId())
                .name(lead.getName())
                .email(lead.getEmail())
                .phone(lead.getPhone())
                .sourcePlatform(lead.getSourcePlatform())
                .campaignName(lead.getCampaignName())
                .campaignId(lead.getCampaign() != null ? lead.getCampaign().getId() : null)
                .status(lead.getStatus())
                .assignedToId(lead.getAssignedTo() != null ? lead.getAssignedTo().getId() : null)
                .assignedToName(lead.getAssignedTo() != null ? lead.getAssignedTo().getFullName() : "Unassigned")
                .createdAt(lead.getCreatedAt())
                .build();
    }
}
