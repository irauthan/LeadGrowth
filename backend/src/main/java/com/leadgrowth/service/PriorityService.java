package com.leadgrowth.service;

import com.leadgrowth.dto.PriorityDto;
import com.leadgrowth.dto.PriorityStatsDto;
import com.leadgrowth.entity.Lead;
import com.leadgrowth.entity.SalesActivityLog;
import com.leadgrowth.entity.User;
import com.leadgrowth.entity.FollowupReminder;
import com.leadgrowth.repository.FollowupRepository;
import com.leadgrowth.repository.LeadRepository;
import com.leadgrowth.repository.SalesActivityLogRepository;
import com.leadgrowth.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class PriorityService {

    private final LeadRepository leadRepository;
    private final SalesActivityLogRepository salesActivityLogRepository;
    private final UserRepository userRepository;
    private final FollowupRepository followupRepository;

    public PriorityService(
            LeadRepository leadRepository,
            SalesActivityLogRepository salesActivityLogRepository,
            UserRepository userRepository,
            FollowupRepository followupRepository
    ) {
        this.leadRepository = leadRepository;
        this.salesActivityLogRepository = salesActivityLogRepository;
        this.userRepository = userRepository;
        this.followupRepository = followupRepository;
    }

    public List<PriorityDto> getPrioritizedLeadsForUser(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Lead> leads;
        if (isUserOnly(user)) {
            leads = leadRepository.findByAssignedToIdOrderByCreatedAtDesc(user.getId());
        } else {
            leads = user.getWorkspace() != null 
                    ? leadRepository.findByWorkspaceIdOrderByCreatedAtDesc(user.getWorkspace().getId())
                    : leadRepository.findByAssignedToIdOrderByCreatedAtDesc(user.getId());
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDate today = LocalDate.now();

        List<PriorityDto> resultList = new ArrayList<>();

        for (Lead lead : leads) {
            String status = lead.getStatus() != null ? lead.getStatus() : "New";
            // Ignore converted, lost, or rejected from active priority queue
            if ("Converted".equalsIgnoreCase(status) || "Lost".equalsIgnoreCase(status) || "Rejected".equalsIgnoreCase(status)) {
                continue;
            }

            // Find latest activity log to extract nextFollowupDate and last activity text
            List<SalesActivityLog> logs = salesActivityLogRepository.findByLeadIdOrderByCreatedAtDesc(lead.getId());
            LocalDateTime nextFollowup = null;
            String lastActivityDesc = "Lead created";
            LocalDateTime lastActivityAt = lead.getCreatedAt();

            if (!logs.isEmpty()) {
                SalesActivityLog latest = logs.get(0);
                lastActivityAt = latest.getCreatedAt();
                lastActivityDesc = (latest.getCommunicationType() != null ? latest.getCommunicationType() : "Interaction") 
                                 + " - " + (latest.getOutcome() != null ? latest.getOutcome() : "Logged");

                for (SalesActivityLog l : logs) {
                    if (l.getNextFollowupDate() != null) {
                        nextFollowup = l.getNextFollowupDate();
                        break;
                    }
                }
            }

            // Also check FollowupReminder table for scheduled follow-ups
            List<FollowupReminder> followups = followupRepository.findByLeadIdOrderByScheduledAtDesc(lead.getId());
            if (followups != null && !followups.isEmpty()) {
                FollowupReminder activeReminder = followups.stream()
                        .filter(f -> !"COMPLETED".equalsIgnoreCase(f.getStatus()) && !"CANCELLED".equalsIgnoreCase(f.getStatus()))
                        .findFirst()
                        .orElse(null);
                if (activeReminder != null) {
                    LocalDateTime schedTime = activeReminder.getScheduledAt() != null ? activeReminder.getScheduledAt() : activeReminder.getNextFollowupDate();
                    if (schedTime != null && (nextFollowup == null || schedTime.isBefore(nextFollowup))) {
                        nextFollowup = schedTime;
                    }
                }
            }

            // Calculate Priority Level
            String priorityLevel;
            String priorityLabel;
            String urgencyReason;
            int priorityRank;

            if (nextFollowup != null && nextFollowup.isBefore(now)) {
                priorityLevel = "P1_OVERDUE_FOLLOWUP";
                priorityLabel = "Priority 1";
                urgencyReason = "Overdue Follow-up scheduled for " + nextFollowup.format(DateTimeFormatter.ofPattern("MMM dd, HH:mm"));
                priorityRank = 1;
            } else if ("Negotiation".equalsIgnoreCase(status)) {
                priorityLevel = "P2_TODAY_NEGOTIATION";
                priorityLabel = "Priority 2";
                urgencyReason = "Active Negotiation requiring deal closure action";
                priorityRank = 2;
            } else if ("Proposal Sent".equalsIgnoreCase(status)) {
                priorityLevel = "P3_TODAY_PROPOSAL";
                priorityLabel = "Priority 3";
                urgencyReason = "Proposal Sent - pending customer review / follow-up";
                priorityRank = 3;
            } else if (nextFollowup != null && nextFollowup.toLocalDate().isEqual(today)) {
                priorityLevel = "P4_TODAY_FOLLOWUP";
                priorityLabel = "Priority 4";
                urgencyReason = "Scheduled Follow-up due today";
                priorityRank = 4;
            } else if ("New".equalsIgnoreCase(status) && lead.getCreatedAt() != null && lead.getCreatedAt().toLocalDate().isEqual(today)) {
                priorityLevel = "P5_TODAY_NEW_LEAD";
                priorityLabel = "Priority 5";
                urgencyReason = "Fresh inbound lead received today";
                priorityRank = 5;
            } else {
                priorityLevel = "P6_REMAINING_PIPELINE";
                priorityLabel = "Priority 6";
                urgencyReason = "Standard active pipeline follow-up";
                priorityRank = 6;
            }

            PriorityDto dto = new PriorityDto();
            dto.setLeadId(lead.getId());
            dto.setName(lead.getName());
            dto.setCompany(lead.getCompany() != null ? lead.getCompany() : "N/A");
            dto.setEmail(lead.getEmail());
            dto.setPhone(lead.getPhone());
            dto.setSourcePlatform(lead.getSourcePlatform());
            dto.setCurrentStage(status);
            dto.setQualityScore(lead.getQualityScore() != null ? lead.getQualityScore() : 75);
            dto.setQualityTier(lead.getQualityTier() != null ? lead.getQualityTier() : "WARM");
            dto.setConversionProbability(lead.getConversionProbability() != null ? lead.getConversionProbability() : 75.0);

            dto.setPriorityLevel(priorityLevel);
            dto.setPriorityLabel(priorityLabel);
            dto.setUrgencyReason(urgencyReason);

            if (nextFollowup != null) {
                dto.setDueDate(nextFollowup.toLocalDate().toString());
                dto.setDueTime(nextFollowup.toLocalTime().format(DateTimeFormatter.ofPattern("HH:mm")));
            } else if (lead.getCreatedAt() != null) {
                dto.setDueDate(lead.getCreatedAt().toLocalDate().toString());
                dto.setDueTime(lead.getCreatedAt().toLocalTime().format(DateTimeFormatter.ofPattern("HH:mm")));
            }

            if (lead.getAssignedTo() != null) {
                dto.setAssignedToId(lead.getAssignedTo().getId());
                dto.setAssignedToName(lead.getAssignedTo().getFullName());
            }

            dto.setCreatedAt(lead.getCreatedAt());
            dto.setLastActivityAt(lastActivityAt);
            dto.setLastActivityDescription(lastActivityDesc);

            resultList.add(dto);
        }

        // Enterprise Smart Sorting: Priority Rank (1 to 6) -> Due Date/Time (earliest first) -> Quality Score (desc) -> Last Activity (desc)
        resultList.sort((a, b) -> {
            int rankA = getRankInt(a.getPriorityLevel());
            int rankB = getRankInt(b.getPriorityLevel());
            if (rankA != rankB) {
                return Integer.compare(rankA, rankB);
            }
            // Due Date sorting
            if (a.getDueDate() != null && b.getDueDate() != null) {
                int dateComp = a.getDueDate().compareTo(b.getDueDate());
                if (dateComp != 0) return dateComp;
            }
            // Quality score descending
            int scoreA = a.getQualityScore() != null ? a.getQualityScore() : 0;
            int scoreB = b.getQualityScore() != null ? b.getQualityScore() : 0;
            if (scoreA != scoreB) {
                return Integer.compare(scoreB, scoreA);
            }
            // Last activity descending
            if (a.getLastActivityAt() != null && b.getLastActivityAt() != null) {
                return b.getLastActivityAt().compareTo(a.getLastActivityAt());
            }
            return 0;
        });

        return resultList;
    }

    public PriorityStatsDto getPriorityStatsForUser(String userEmail) {
        List<PriorityDto> priorities = getPrioritizedLeadsForUser(userEmail);

        long todaysWork = 0;
        long overdue = 0;
        long highPriority = 0;
        long todaysFollowups = 0;
        long negotiations = 0;
        long newLeads = 0;

        for (PriorityDto dto : priorities) {
            String level = dto.getPriorityLevel();
            if ("P1_OVERDUE_FOLLOWUP".equals(level)) {
                overdue++;
                highPriority++;
                todaysWork++;
            } else if ("P2_TODAY_NEGOTIATION".equals(level)) {
                negotiations++;
                highPriority++;
                todaysWork++;
            } else if ("P3_TODAY_PROPOSAL".equals(level)) {
                todaysWork++;
            } else if ("P4_TODAY_FOLLOWUP".equals(level)) {
                todaysFollowups++;
                todaysWork++;
            } else if ("P5_TODAY_NEW_LEAD".equals(level)) {
                newLeads++;
                todaysWork++;
            }
        }

        // Count completed today for stats
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        LocalDate today = LocalDate.now();

        List<Lead> leads;
        if (isUserOnly(user)) {
            leads = leadRepository.findByAssignedToIdOrderByCreatedAtDesc(user.getId());
        } else {
            leads = user.getWorkspace() != null 
                    ? leadRepository.findByWorkspaceIdOrderByCreatedAtDesc(user.getWorkspace().getId())
                    : leadRepository.findByAssignedToIdOrderByCreatedAtDesc(user.getId());
        }

        long completedToday = leads.stream()
                .filter(l -> "Converted".equalsIgnoreCase(l.getStatus()))
                .count();

        return new PriorityStatsDto(todaysWork, overdue, highPriority, todaysFollowups, negotiations, newLeads, completedToday);
    }

    private boolean isUserOnly(User user) {
        if (user.getRoles() == null || user.getRoles().isEmpty()) return true;
        return user.getRoles().stream().noneMatch(r -> {
            String name = r.getName() != null ? r.getName().toUpperCase() : "";
            return name.contains("ADMIN") || name.contains("MANAGER");
        });
    }

    private int getRankInt(String level) {
        if ("P1_OVERDUE_FOLLOWUP".equals(level)) return 1;
        if ("P2_TODAY_NEGOTIATION".equals(level)) return 2;
        if ("P3_TODAY_PROPOSAL".equals(level)) return 3;
        if ("P4_TODAY_FOLLOWUP".equals(level)) return 4;
        if ("P5_TODAY_NEW_LEAD".equals(level)) return 5;
        return 6;
    }
}
