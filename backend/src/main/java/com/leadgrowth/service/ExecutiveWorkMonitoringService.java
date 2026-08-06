package com.leadgrowth.service;

import com.leadgrowth.dto.*;
import com.leadgrowth.entity.*;
import com.leadgrowth.repository.*;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ExecutiveWorkMonitoringService {

    private final UserRepository userRepository;
    private final LeadRepository leadRepository;
    private final SalesActivityLogRepository salesActivityLogRepository;
    private final FollowupRepository followupRepository;
    private final LeadHistoryRepository leadHistoryRepository;

    public ExecutiveWorkMonitoringService(
            UserRepository userRepository,
            LeadRepository leadRepository,
            SalesActivityLogRepository salesActivityLogRepository,
            FollowupRepository followupRepository,
            LeadHistoryRepository leadHistoryRepository
    ) {
        this.userRepository = userRepository;
        this.leadRepository = leadRepository;
        this.salesActivityLogRepository = salesActivityLogRepository;
        this.followupRepository = followupRepository;
        this.leadHistoryRepository = leadHistoryRepository;
    }

    @Transactional(readOnly = true)
    public ExecutiveWorkSummaryDto getExecutiveWorkSummary(
            String actorEmail,
            Long targetUserId,
            String timeframe,
            String customStartDate,
            String customEndDate
    ) {
        User actor = userRepository.findByEmail(actorEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        if (actor.getWorkspace() == null) {
            throw new IllegalStateException("User is not assigned to any workspace.");
        }

        // Target User logic
        User targetUser = null;
        if (targetUserId != null && targetUserId > 0) {
            User found = userRepository.findById(targetUserId).orElse(null);
            if (found != null && found.getRoles().stream().noneMatch(r -> "ROLE_ADMIN".equalsIgnoreCase(r.getName()))) {
                targetUser = found;
            }
        }

        // Date Range determination
        LocalDateTime startDateTime;
        LocalDateTime endDateTime = LocalDateTime.now().with(LocalTime.MAX);
        LocalDateTime now = LocalDateTime.now();

        String tf = timeframe != null ? timeframe.trim().toUpperCase() : "THIS_MONTH";

        if ("TODAY".equals(tf)) {
            startDateTime = now.with(LocalTime.MIN);
        } else if ("YESTERDAY".equals(tf)) {
            startDateTime = now.minusDays(1).with(LocalTime.MIN);
            endDateTime = now.minusDays(1).with(LocalTime.MAX);
        } else if ("THIS_WEEK".equals(tf)) {
            startDateTime = now.minusDays(now.getDayOfWeek().getValue() - 1).with(LocalTime.MIN);
        } else if ("THIS_MONTH".equals(tf)) {
            startDateTime = now.withDayOfMonth(1).with(LocalTime.MIN);
        } else if ("CUSTOM".equals(tf) && customStartDate != null && !customStartDate.isBlank()) {
            try {
                startDateTime = LocalDate.parse(customStartDate.substring(0, 10)).atStartOfDay();
                if (customEndDate != null && !customEndDate.isBlank()) {
                    endDateTime = LocalDate.parse(customEndDate.substring(0, 10)).atTime(LocalTime.MAX);
                }
            } catch (Exception e) {
                startDateTime = now.withDayOfMonth(1).with(LocalTime.MIN);
            }
        } else {
            startDateTime = now.withDayOfMonth(1).with(LocalTime.MIN);
        }

        List<Lead> userLeads;
        List<SalesActivityLog> logs;
        List<FollowupReminder> followups;

        String summaryName;
        String summaryEmail;
        String summaryRole;
        String summaryProfileImage;
        Long summaryUserId;

        if (targetUser != null) {
            userLeads = leadRepository.findByAssignedToIdOrderByCreatedAtDesc(targetUser.getId());
            logs = salesActivityLogRepository.findByLoggedByIdAndCreatedAtBetweenOrderByCreatedAtDesc(
                    targetUser.getId(), startDateTime, endDateTime
            );
            followups = followupRepository.findByAssignedToIdOrderByScheduledAtAsc(targetUser.getId());
            summaryName = targetUser.getFullName();
            summaryEmail = targetUser.getEmail();
            summaryRole = targetUser.getRoles().isEmpty() ? "USER" : targetUser.getRoles().iterator().next().getName().replace("ROLE_", "");
            summaryProfileImage = targetUser.getProfileImage();
            summaryUserId = targetUser.getId();
        } else {
            List<User> workspaceUsers = userRepository.findByWorkspaceId(actor.getWorkspace().getId());
            List<Long> nonAdminUserIds = workspaceUsers.stream()
                    .filter(u -> u.getRoles().stream().noneMatch(r -> "ROLE_ADMIN".equalsIgnoreCase(r.getName())))
                    .map(User::getId)
                    .collect(Collectors.toList());

            if (!nonAdminUserIds.isEmpty()) {
                userLeads = leadRepository.findByWorkspaceIdOrderByCreatedAtDesc(actor.getWorkspace().getId()).stream()
                        .filter(l -> l.getAssignedTo() != null && nonAdminUserIds.contains(l.getAssignedTo().getId()))
                        .collect(Collectors.toList());

                logs = salesActivityLogRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(startDateTime, endDateTime).stream()
                        .filter(l -> l.getLoggedBy() != null && nonAdminUserIds.contains(l.getLoggedBy().getId()))
                        .collect(Collectors.toList());

                followups = followupRepository.findAll().stream()
                        .filter(f -> f.getAssignedTo() != null && nonAdminUserIds.contains(f.getAssignedTo().getId()))
                        .collect(Collectors.toList());
            } else {
                userLeads = leadRepository.findByWorkspaceIdOrderByCreatedAtDesc(actor.getWorkspace().getId());
                logs = salesActivityLogRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(startDateTime, endDateTime);
                followups = followupRepository.findAll();
            }

            summaryName = "All Executive Staff";
            summaryEmail = "staff@" + actor.getWorkspace().getSlug() + ".com";
            summaryRole = "EXECUTIVE_STAFF";
            summaryProfileImage = null;
            summaryUserId = 0L;
        }

        // Calculate KPI totals
        long totalAssignedLeads = userLeads.size();
        long totalActivities = logs.size();
        long totalCalls = logs.stream().filter(l -> "PHONE_CALL".equalsIgnoreCase(l.getCommunicationType()) || "CALL".equalsIgnoreCase(l.getCommunicationType())).count();
        long totalMeetings = logs.stream().filter(l -> "MEETING".equalsIgnoreCase(l.getCommunicationType()) || "DEMO".equalsIgnoreCase(l.getCommunicationType()) || "GOOGLE_MEET".equalsIgnoreCase(l.getCommunicationType())).count();
        long totalEmails = logs.stream().filter(l -> "EMAIL".equalsIgnoreCase(l.getCommunicationType())).count();
        long totalWhatsapp = logs.stream().filter(l -> "WHATSAPP".equalsIgnoreCase(l.getCommunicationType())).count();

        long completedFollowups = followups.stream().filter(f -> "COMPLETED".equalsIgnoreCase(f.getStatus())).count();
        long overdueFollowups = followups.stream().filter(f -> "OVERDUE".equalsIgnoreCase(f.getStatus()) || "MISSED".equalsIgnoreCase(f.getStatus()) || (f.getScheduledAt() != null && f.getScheduledAt().isBefore(now) && !"COMPLETED".equalsIgnoreCase(f.getStatus()) && !"CANCELLED".equalsIgnoreCase(f.getStatus()))).count();

        long convertedLeads = userLeads.stream().filter(l -> "Converted".equalsIgnoreCase(l.getStatus()) || "Closed Won".equalsIgnoreCase(l.getStatus()) || "CONVERTED".equalsIgnoreCase(l.getStatus())).count();

        double conversionRate = totalAssignedLeads > 0 ? (double) convertedLeads / totalAssignedLeads : 0.0;
        double activityRate = totalAssignedLeads > 0 ? (double) totalActivities / totalAssignedLeads : 0.0;

        // 4. Group Daily Breakdown
        Map<String, ExecutiveDayBreakdownDto> dayMap = new LinkedHashMap<>();
        LocalDate curr = startDateTime.toLocalDate();
        LocalDate endLocalDate = endDateTime.toLocalDate();

        while (!curr.isAfter(endLocalDate) && !curr.isAfter(LocalDate.now())) {
            String dateStr = curr.toString();
            String dayOfWeekStr = curr.getDayOfWeek().name();
            dayMap.put(dateStr, new ExecutiveDayBreakdownDto(dateStr, dayOfWeekStr, 0, 0, 0, 0, 0, 0));
            curr = curr.plusDays(1);
        }

        for (SalesActivityLog log : logs) {
            if (log.getCreatedAt() == null) continue;
            String dateKey = log.getCreatedAt().toLocalDate().toString();
            ExecutiveDayBreakdownDto dayDto = dayMap.get(dateKey);
            if (dayDto != null) {
                dayDto.setTotalActivitiesCount(dayDto.getTotalActivitiesCount() + 1);
                String comm = log.getCommunicationType() != null ? log.getCommunicationType().toUpperCase() : "";
                if (comm.contains("CALL")) dayDto.setCallsCount(dayDto.getCallsCount() + 1);
                else if (comm.contains("MEETING") || comm.contains("DEMO") || comm.contains("MEET")) dayDto.setMeetingsCount(dayDto.getMeetingsCount() + 1);
                else if (comm.contains("EMAIL")) dayDto.setEmailsCount(dayDto.getEmailsCount() + 1);
                else if (comm.contains("WHATSAPP")) dayDto.setWhatsappCount(dayDto.getWhatsappCount() + 1);
            }
        }

        for (FollowupReminder f : followups) {
            if ("COMPLETED".equalsIgnoreCase(f.getStatus()) && f.getCompletedAt() != null) {
                String dateKey = f.getCompletedAt().toLocalDate().toString();
                ExecutiveDayBreakdownDto dayDto = dayMap.get(dateKey);
                if (dayDto != null) {
                    dayDto.setFollowupsCompletedCount(dayDto.getFollowupsCompletedCount() + 1);
                }
            }
        }

        List<ExecutiveDayBreakdownDto> dailyBreakdown = new ArrayList<>(dayMap.values());

        // 5. Build Lead-by-Lead Detailed Work DTOs
        List<ExecutiveLeadWorkDto> leadWorkList = new ArrayList<>();

        for (Lead lead : userLeads) {
            List<SalesActivityLog> leadLogs = salesActivityLogRepository.findByLeadIdOrderByCreatedAtAsc(lead.getId());
            List<SalesActivityLogDto> logDtos = leadLogs.stream().map(this::convertLogToDto).collect(Collectors.toList());

            List<FollowupReminder> leadFollowups = followupRepository.findByLeadIdOrderByScheduledAtDesc(lead.getId());
            List<Map<String, Object>> followupMaps = leadFollowups.stream().map(this::convertFollowupToMap).collect(Collectors.toList());

            List<LeadHistory> histories = leadHistoryRepository.findByLeadIdOrderByTimestampDesc(lead.getId());
            List<LeadHistoryDto> historyDtos = histories.stream().map(this::convertHistoryToDto).collect(Collectors.toList());

            String lastActivity = leadLogs.isEmpty() ? (lead.getCreatedAt() != null ? lead.getCreatedAt().toString() : "N/A") : leadLogs.get(leadLogs.size() - 1).getCreatedAt().toString();
            String assignedName = lead.getAssignedTo() != null ? lead.getAssignedTo().getFullName() : "Unassigned";
            Long assignedId = lead.getAssignedTo() != null ? lead.getAssignedTo().getId() : 0L;

            leadWorkList.add(new ExecutiveLeadWorkDto(
                    lead.getId(),
                    lead.getName(),
                    lead.getPhone(),
                    lead.getEmail(),
                    lead.getStatus(),
                    lead.getPriority(),
                    assignedName,
                    assignedId,
                    lastActivity,
                    leadLogs.size(),
                    logDtos,
                    followupMaps,
                    historyDtos
            ));
        }

        return new ExecutiveWorkSummaryDto(
                summaryUserId,
                summaryName,
                summaryEmail,
                summaryRole,
                summaryProfileImage,
                tf,
                totalAssignedLeads,
                totalActivities,
                totalCalls,
                totalMeetings,
                totalEmails,
                totalWhatsapp,
                completedFollowups,
                overdueFollowups,
                convertedLeads,
                conversionRate,
                activityRate,
                dailyBreakdown,
                leadWorkList
        );
    }

    private SalesActivityLogDto convertLogToDto(SalesActivityLog log) {
        SalesActivityLogDto dto = new SalesActivityLogDto();
        dto.setId(log.getId());
        dto.setActivityNumber(log.getActivityNumber());
        dto.setCommunicationType(log.getCommunicationType());
        dto.setOutcome(log.getOutcome());
        dto.setRemarks(log.getRemarks());
        dto.setDuration(log.getDuration());
        dto.setStatus(log.getStatus());
        dto.setNextFollowupDate(log.getNextFollowupDate());
        dto.setCreatedAt(log.getCreatedAt());
        if (log.getLoggedBy() != null) {
            dto.setLoggedById(log.getLoggedBy().getId());
            dto.setLoggedByName(log.getLoggedBy().getFullName());
        } else {
            dto.setLoggedByName("Executive");
        }
        return dto;
    }

    private Map<String, Object> convertFollowupToMap(FollowupReminder f) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", f.getId());
        map.put("scheduledAt", f.getScheduledAt() != null ? f.getScheduledAt().toString() : "");
        map.put("status", f.getStatus());
        map.put("type", f.getType());
        map.put("notes", f.getNotes());
        map.put("remarks", f.getRemarks());
        map.put("outcome", f.getOutcome());
        map.put("completedAt", f.getCompletedAt() != null ? f.getCompletedAt().toString() : null);
        map.put("isOverdue", "OVERDUE".equalsIgnoreCase(f.getStatus()) || "MISSED".equalsIgnoreCase(f.getStatus()));
        return map;
    }

    private LeadHistoryDto convertHistoryToDto(LeadHistory h) {
        LeadHistoryDto dto = new LeadHistoryDto();
        dto.setId(h.getId());
        dto.setAction(h.getAction());
        dto.setDescription(h.getDescription());
        dto.setPreviousStatus(h.getPreviousStatus());
        dto.setNewStatus(h.getNewStatus());
        dto.setTimestamp(h.getTimestamp());
        if (h.getPerformedBy() != null) {
            dto.setPerformedById(h.getPerformedBy().getId());
            dto.setPerformedByName(h.getPerformedBy().getFullName());
        } else {
            dto.setPerformedByName("System");
        }
        return dto;
    }
}
