package com.leadgrowth.service;

import com.leadgrowth.dto.LeadDto;
import com.leadgrowth.entity.AssignmentLog;
import com.leadgrowth.entity.Lead;
import com.leadgrowth.entity.LeadAssignment;
import com.leadgrowth.entity.User;
import com.leadgrowth.repository.*;
import com.leadgrowth.websocket.WebSocketManager;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class LeadQueueService {

    private final LeadRepository leadRepository;
    private final UserRepository userRepository;
    private final LeadAssignmentRepository leadAssignmentRepository;
    private final AssignmentLogRepository assignmentLogRepository;
    private final NotificationRepository notificationRepository;
    private final WebSocketManager webSocketManager;
    private final AuditService auditService;

    public LeadQueueService(
            LeadRepository leadRepository,
            UserRepository userRepository,
            LeadAssignmentRepository leadAssignmentRepository,
            AssignmentLogRepository assignmentLogRepository,
            NotificationRepository notificationRepository,
            WebSocketManager webSocketManager,
            AuditService auditService
    ) {
        this.leadRepository = leadRepository;
        this.userRepository = userRepository;
        this.leadAssignmentRepository = leadAssignmentRepository;
        this.assignmentLogRepository = assignmentLogRepository;
        this.notificationRepository = notificationRepository;
        this.webSocketManager = webSocketManager;
        this.auditService = auditService;
    }

    public List<LeadDto> getUnassignedLeadQueue(Long workspaceId) {
        List<Lead> leads = leadRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceId);
        return leads.stream()
                .filter(l -> l.getAssignedTo() == null || "IN_QUEUE".equals(l.getQueueStatus()))
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public List<LeadDto> bulkAssignLeads(List<Long> leadIds, Long targetUserId, String actorEmail) {
        User actor = userRepository.findByEmail(actorEmail)
                .orElseThrow(() -> new RuntimeException("Actor not found"));
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new RuntimeException("Target user not found"));

        List<LeadDto> assignedList = new ArrayList<>();
        for (Long id : leadIds) {
            Lead lead = leadRepository.findById(id).orElse(null);
            if (lead != null && lead.getWorkspace().getId().equals(actor.getWorkspace().getId())) {
                lead.setAssignedTo(targetUser);
                lead.setQueueStatus("ASSIGNED");
                Lead saved = leadRepository.save(lead);

                auditService.logAction(lead.getWorkspace(), actor, "LEAD_ASSIGNED", "LEAD", saved.getId(),
                        "Bulk assigned lead " + saved.getName() + " to " + targetUser.getFullName());

                assignedList.add(convertToDto(saved));
            }
        }
        return assignedList;
    }

    public LeadDto autoAssignLead(Long leadId, String actorEmail) {
        User actor = userRepository.findByEmail(actorEmail)
                .orElseThrow(() -> new RuntimeException("Actor user not found"));

        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new RuntimeException("Lead not found"));

        Long workspaceId = actor.getWorkspace().getId();
        User bestAssignee = findBestAssignee(workspaceId);

        if (bestAssignee != null) {
            lead.setAssignedTo(bestAssignee);
            lead.setQueueStatus("ASSIGNED");
            Lead saved = leadRepository.save(lead);

            bestAssignee.setLastAssignedAt(LocalDateTime.now());
            userRepository.save(bestAssignee);

            leadAssignmentRepository.save(new LeadAssignment(saved, bestAssignee));
            assignmentLogRepository.save(new AssignmentLog(
                    actor.getWorkspace(), "LEAD", saved.getId(), bestAssignee, "Auto-Assigned via Hybrid Algorithm (Availability & Workload)"
            ));

            auditService.logAction(actor.getWorkspace(), actor, "LEAD_AUTO_ASSIGNED", "LEAD", saved.getId(),
                    "Auto-assigned lead '" + saved.getName() + "' to " + bestAssignee.getFullName());

            return convertToDto(saved);
        } else {
            throw new IllegalStateException("No available team members currently eligible for auto-assignment.");
        }
    }

    public LeadDto triggerIdlePreventionSweep(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Long workspaceId = user.getWorkspace().getId();
        List<Lead> queue = leadRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceId).stream()
                .filter(l -> l.getAssignedTo() == null || "IN_QUEUE".equals(l.getQueueStatus()))
                .collect(Collectors.toList());

        if (queue.isEmpty()) {
            return null;
        }

        // Draw top priority lead from queue
        Lead leadToAssign = queue.get(0);
        leadToAssign.setAssignedTo(user);
        leadToAssign.setQueueStatus("ASSIGNED");
        Lead saved = leadRepository.save(leadToAssign);

        user.setLastAssignedAt(LocalDateTime.now());
        userRepository.save(user);

        leadAssignmentRepository.save(new LeadAssignment(saved, user));
        assignmentLogRepository.save(new AssignmentLog(
                user.getWorkspace(), "LEAD", saved.getId(), user, "Assigned via User Idle Prevention Sweep"
        ));

        return convertToDto(saved);
    }

    private User findBestAssignee(Long workspaceId) {
        List<User> candidates = userRepository.findByWorkspaceId(workspaceId).stream()
                .filter(u -> "ACTIVE".equalsIgnoreCase(u.getStatus()))
                .filter(u -> !"OFFLINE".equals(u.getAvailabilityStatus()) && !"ON_LEAVE".equals(u.getAvailabilityStatus()))
                .collect(Collectors.toList());

        if (candidates.isEmpty()) return null;

        // Sort by availability (AVAILABLE > ON_BREAK > BUSY) then least recently assigned
        candidates.sort((u1, u2) -> {
            int score1 = getAvailabilityScore(u1.getAvailabilityStatus());
            int score2 = getAvailabilityScore(u2.getAvailabilityStatus());
            if (score1 != score2) return Integer.compare(score2, score1);

            LocalDateTime t1 = u1.getLastAssignedAt() != null ? u1.getLastAssignedAt() : LocalDateTime.MIN;
            LocalDateTime t2 = u2.getLastAssignedAt() != null ? u2.getLastAssignedAt() : LocalDateTime.MIN;
            return t1.compareTo(t2);
        });

        return candidates.get(0);
    }

    private int getAvailabilityScore(String status) {
        if (status == null) return 0;
        switch (status.toUpperCase()) {
            case "AVAILABLE": return 3;
            case "ON_BREAK": return 2;
            case "BUSY": return 1;
            default: return 0;
        }
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
                .qualityScore(lead.getQualityScore() != null ? lead.getQualityScore() : 75)
                .qualityTier(lead.getQualityTier() != null ? lead.getQualityTier() : "WARM")
                .conversionProbability(lead.getConversionProbability() != null ? lead.getConversionProbability() : 75.0)
                .queueStatus(lead.getQueueStatus() != null ? lead.getQueueStatus() : (lead.getAssignedTo() != null ? "ASSIGNED" : "IN_QUEUE"))
                .createdAt(lead.getCreatedAt())
                .build();
    }
}
