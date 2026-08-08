package com.leadgrowth.service.impl;

import com.leadgrowth.dto.CallAnalyticsDto;
import com.leadgrowth.dto.CallSessionDto;
import com.leadgrowth.entity.CallHistory;
import com.leadgrowth.entity.Lead;
import com.leadgrowth.entity.Notification;
import com.leadgrowth.entity.User;
import com.leadgrowth.repository.CallHistoryRepository;
import com.leadgrowth.repository.LeadRepository;
import com.leadgrowth.repository.NotificationRepository;
import com.leadgrowth.repository.UserRepository;
import com.leadgrowth.service.CallService;
import com.leadgrowth.websocket.WebSocketManager;
import com.leadgrowth.entity.FollowupReminder;
import com.leadgrowth.repository.FollowupRepository;
import com.leadgrowth.service.CalendarService;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class CallServiceImpl implements CallService {

    private final CallHistoryRepository callHistoryRepository;
    private final LeadRepository leadRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final WebSocketManager webSocketManager;
    private final FollowupRepository followupRepository;
    private final CalendarService calendarService;

    public CallServiceImpl(
            CallHistoryRepository callHistoryRepository,
            LeadRepository leadRepository,
            UserRepository userRepository,
            NotificationRepository notificationRepository,
            @Lazy WebSocketManager webSocketManager,
            FollowupRepository followupRepository,
            @Lazy CalendarService calendarService
    ) {
        this.callHistoryRepository = callHistoryRepository;
        this.leadRepository = leadRepository;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
        this.webSocketManager = webSocketManager;
        this.followupRepository = followupRepository;
        this.calendarService = calendarService;
    }

    @Override
    @Transactional
    public CallSessionDto startCall(Long leadId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new RuntimeException("Lead not found"));

        // Validation 1: Verify lead assignment (only assigned user or Admin/Manager can start call)
        boolean isOwner = lead.getAssignedTo() != null && lead.getAssignedTo().getId().equals(user.getId());
        boolean isAdminOrManager = user.getRoles().stream()
                .anyMatch(r -> r.getName().equals("ROLE_ADMIN") || r.getName().equals("ROLE_MANAGER"));
        if (!isOwner && !isAdminOrManager) {
            throw new IllegalArgumentException("You can only start a call on your assigned leads.");
        }

        // Validation 2: Ensure user has no active call currently running
        Optional<CallHistory> existingActive = callHistoryRepository.findFirstByUserIdAndStatusOrderByIdDesc(user.getId(), "ACTIVE");
        if (existingActive.isPresent()) {
            throw new IllegalArgumentException("You already have an active call session running. End the current call before starting a new one.");
        }

        CallHistory call = new CallHistory(lead, user, user.getWorkspace(), LocalDateTime.now());
        CallHistory saved = callHistoryRepository.save(call);

        CallSessionDto dto = convertToDto(saved);

        // Broadcast realtime WebSocket notification
        webSocketManager.broadcastCallSession(user.getWorkspace().getId(), dto);

        return dto;
    }

    @Override
    @Transactional
    public CallSessionDto endCall(Long callId, String userEmail, String notes) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        CallHistory call;
        if (callId != null) {
            call = callHistoryRepository.findById(callId)
                    .orElseThrow(() -> new RuntimeException("Call session not found"));
        } else {
            call = callHistoryRepository.findFirstByUserIdAndStatusOrderByIdDesc(user.getId(), "ACTIVE")
                    .orElseThrow(() -> new RuntimeException("No active call session found for current user."));
        }

        if (!"ACTIVE".equals(call.getStatus())) {
            throw new IllegalArgumentException("This call session has already ended or is not active.");
        }

        LocalDateTime now = LocalDateTime.now();
        call.setEndTime(now);
        long seconds = Duration.between(call.getStartTime(), now).getSeconds();
        if (seconds < 0) seconds = 0;

        call.setDurationSeconds(seconds);
        call.setDurationMinutes(Math.round((seconds / 60.0) * 100.0) / 100.0);
        call.setFormattedDuration(formatSecondsToHHMMSS(seconds));
        call.setStatus("COMPLETED");
        if (notes != null && !notes.trim().isEmpty()) {
            call.setNotes(notes);
        }
        call.setUpdatedAt(now);

        CallHistory saved = callHistoryRepository.save(call);
        CallSessionDto dto = convertToDto(saved);

        // Send WebSocket Notification to workspace
        // Auto-complete any pending/upcoming followups for this lead
        if (call.getLead() != null) {
            try {
                List<FollowupReminder> existingReminders = followupRepository.findByLeadIdOrderByScheduledAtDesc(call.getLead().getId());
                for (FollowupReminder r : existingReminders) {
                    if ("UPCOMING".equalsIgnoreCase(r.getStatus()) || "PENDING".equalsIgnoreCase(r.getStatus()) || "OVERDUE".equalsIgnoreCase(r.getStatus()) || "MISSED".equalsIgnoreCase(r.getStatus())) {
                        r.setStatus("COMPLETED");
                        r.setCompletedAt(now);
                        if (notes != null && !notes.isBlank()) {
                            r.setOutcome(notes);
                        }
                        FollowupReminder savedR = followupRepository.save(r);
                        if (calendarService != null) {
                            calendarService.syncFollowupToCalendar(savedR);
                        }
                    }
                }
            } catch (Exception e) {
                System.err.println("Failed to resolve followups on call end: " + e.getMessage());
            }
        }

        return dto;
    }

    @Override
    public CallSessionDto getActiveCall(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return callHistoryRepository.findFirstByUserIdAndStatusOrderByIdDesc(user.getId(), "ACTIVE")
                .map(this::convertToDto)
                .orElse(null);
    }

    @Override
    public List<CallSessionDto> getCallHistoryForLead(Long leadId) {
        return callHistoryRepository.findByLeadIdOrderByStartTimeDesc(leadId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public CallAnalyticsDto getUserCallAnalytics(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = LocalDate.now().atTime(LocalTime.MAX);

        List<CallHistory> todayCalls = callHistoryRepository.findByUserIdAndStartTimeBetweenOrderByStartTimeDesc(user.getId(), startOfDay, endOfDay);
        List<CallHistory> completedToday = todayCalls.stream().filter(c -> "COMPLETED".equals(c.getStatus())).collect(Collectors.toList());

        long todaySeconds = completedToday.stream().mapToLong(c -> c.getDurationSeconds() != null ? c.getDurationSeconds() : 0).sum();
        int todayCount = completedToday.size();
        long avgSeconds = todayCount > 0 ? todaySeconds / todayCount : 0;
        long longestSeconds = completedToday.stream().mapToLong(c -> c.getDurationSeconds() != null ? c.getDurationSeconds() : 0).max().orElse(0);

        // Weekly & Monthly Time
        LocalDateTime startOfWeek = LocalDate.now().minusDays(7).atStartOfDay();
        LocalDateTime startOfMonth = LocalDate.now().minusDays(30).atStartOfDay();

        long weeklySeconds = callHistoryRepository.sumDurationSecondsByUserIdAndDateRange(user.getId(), startOfWeek, endOfDay);
        long monthlySeconds = callHistoryRepository.sumDurationSecondsByUserIdAndDateRange(user.getId(), startOfMonth, endOfDay);

        // Daily Chart Data for past 7 days
        List<Map<String, Object>> dailyChart = new ArrayList<>();
        DateTimeFormatter dayFormatter = DateTimeFormatter.ofPattern("EEE dd MMM");
        for (int i = 6; i >= 0; i--) {
            LocalDate d = LocalDate.now().minusDays(i);
            LocalDateTime s = d.atStartOfDay();
            LocalDateTime e = d.atTime(LocalTime.MAX);
            long sec = callHistoryRepository.sumDurationSecondsByUserIdAndDateRange(user.getId(), s, e);

            Map<String, Object> point = new HashMap<>();
            point.put("date", d.format(dayFormatter));
            point.put("minutes", Math.round(sec / 60.0));
            point.put("seconds", sec);
            dailyChart.add(point);
        }

        CallAnalyticsDto dto = new CallAnalyticsDto();
        dto.setTodayCallTimeSeconds(todaySeconds);
        dto.setTodayCallTimeFormatted(formatSecondsToHHMMSS(todaySeconds));
        dto.setTodayCallsCount(todayCount);
        dto.setAvgDurationSeconds(avgSeconds);
        dto.setAvgDurationFormatted(formatSecondsToHHMMSS(avgSeconds));
        dto.setLongestCallSeconds(longestSeconds);
        dto.setLongestCallFormatted(formatSecondsToHHMMSS(longestSeconds));
        dto.setActiveCallSession(getActiveCall(userEmail));
        dto.setWeeklyCallTimeSeconds(weeklySeconds);
        dto.setWeeklyCallTimeFormatted(formatSecondsToHHMMSS(weeklySeconds));
        dto.setMonthlyCallTimeSeconds(monthlySeconds);
        dto.setMonthlyCallTimeFormatted(formatSecondsToHHMMSS(monthlySeconds));
        dto.setDailyCallDurationChart(dailyChart);

        return dto;
    }

    @Override
    public CallAnalyticsDto getTeamCallAnalytics(String managerEmail) {
        User manager = userRepository.findByEmail(managerEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = LocalDate.now().atTime(LocalTime.MAX);

        List<CallHistory> workspaceTodayCalls = callHistoryRepository.findByWorkspaceIdAndStartTimeBetweenOrderByStartTimeDesc(
                manager.getWorkspace().getId(), startOfDay, endOfDay);
        List<CallHistory> completedToday = workspaceTodayCalls.stream().filter(c -> "COMPLETED".equals(c.getStatus())).collect(Collectors.toList());

        long totalTeamSeconds = completedToday.stream().mapToLong(c -> c.getDurationSeconds() != null ? c.getDurationSeconds() : 0).sum();
        int totalTeamCalls = completedToday.size();
        long avgSeconds = totalTeamCalls > 0 ? totalTeamSeconds / totalTeamCalls : 0;
        long longestSeconds = completedToday.stream().mapToLong(c -> c.getDurationSeconds() != null ? c.getDurationSeconds() : 0).max().orElse(0);

        // Leaderboard calculation
        Map<User, Long> userTimeMap = new HashMap<>();
        Map<User, Integer> userCountMap = new HashMap<>();

        for (CallHistory c : completedToday) {
            User u = c.getUser();
            userTimeMap.put(u, userTimeMap.getOrDefault(u, 0L) + (c.getDurationSeconds() != null ? c.getDurationSeconds() : 0));
            userCountMap.put(u, userCountMap.getOrDefault(u, 0) + 1);
        }

        List<Map<String, Object>> leaderboard = new ArrayList<>();
        String topUser = "N/A";
        String leastUser = "N/A";
        long maxTime = -1;
        long minTime = Long.MAX_VALUE;

        int rank = 1;
        List<Map.Entry<User, Long>> sortedEntries = userTimeMap.entrySet().stream()
                .sorted((e1, e2) -> Long.compare(e2.getValue(), e1.getValue()))
                .collect(Collectors.toList());

        for (Map.Entry<User, Long> entry : sortedEntries) {
            User u = entry.getKey();
            long sec = entry.getValue();
            int count = userCountMap.getOrDefault(u, 0);

            if (sec > maxTime) {
                maxTime = sec;
                topUser = u.getFullName();
            }
            if (sec < minTime) {
                minTime = sec;
                leastUser = u.getFullName();
            }

            Map<String, Object> row = new HashMap<>();
            row.put("rank", rank++);
            row.put("userId", u.getId());
            row.put("userName", u.getFullName());
            row.put("callsCount", count);
            row.put("callTimeSeconds", sec);
            row.put("callTimeFormatted", formatSecondsToHHMMSS(sec));
            row.put("avgDurationFormatted", formatSecondsToHHMMSS(count > 0 ? sec / count : 0));
            leaderboard.add(row);
        }

        CallAnalyticsDto dto = new CallAnalyticsDto();
        dto.setTotalTeamCallsToday(totalTeamCalls);
        dto.setTotalTeamCallTimeSeconds(totalTeamSeconds);
        dto.setTotalTeamCallTimeFormatted(formatSecondsToHHMMSS(totalTeamSeconds));
        dto.setAvgDurationSeconds(avgSeconds);
        dto.setAvgDurationFormatted(formatSecondsToHHMMSS(avgSeconds));
        dto.setLongestCallSeconds(longestSeconds);
        dto.setLongestCallFormatted(formatSecondsToHHMMSS(longestSeconds));
        dto.setTopCallingUser(topUser);
        dto.setLeastActiveUser(leastUser);
        dto.setUserProductivityLeaderboard(leaderboard);

        return dto;
    }

    @Override
    public CallAnalyticsDto getAdminCallAnalytics(String adminEmail) {
        return getTeamCallAnalytics(adminEmail);
    }

    @Override
    public List<CallSessionDto> getCallReports(String userEmail, Long userId, String startDate, String endDate) {
        User requester = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        LocalDateTime start = (startDate != null && !startDate.isBlank()) 
                ? LocalDate.parse(startDate).atStartOfDay() 
                : LocalDate.now().minusDays(30).atStartOfDay();

        LocalDateTime end = (endDate != null && !endDate.isBlank()) 
                ? LocalDate.parse(endDate).atTime(LocalTime.MAX) 
                : LocalDate.now().atTime(LocalTime.MAX);

        List<CallHistory> calls;
        if (userId != null) {
            calls = callHistoryRepository.findByUserIdAndStartTimeBetweenOrderByStartTimeDesc(userId, start, end);
        } else {
            boolean isUserRoleOnly = requester.getRoles().stream()
                    .allMatch(r -> r.getName().equals("ROLE_USER"));
            if (isUserRoleOnly) {
                calls = callHistoryRepository.findByUserIdAndStartTimeBetweenOrderByStartTimeDesc(requester.getId(), start, end);
            } else {
                calls = callHistoryRepository.findByWorkspaceIdAndStartTimeBetweenOrderByStartTimeDesc(
                        requester.getWorkspace().getId(), start, end);
            }
        }

        return calls.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    private CallSessionDto convertToDto(CallHistory c) {
        return new CallSessionDto(
                c.getId(),
                c.getLead().getId(),
                c.getLead().getName(),
                c.getLead().getPhone(),
                c.getLead().getCompany(),
                c.getUser().getId(),
                c.getUser().getFullName(),
                c.getUser().getEmail(),
                c.getStartTime(),
                c.getEndTime(),
                c.getDurationSeconds(),
                c.getDurationMinutes(),
                c.getFormattedDuration(),
                c.getStatus(),
                c.getNotes(),
                c.getCreatedAt()
        );
    }

    private String formatSecondsToHHMMSS(long totalSeconds) {
        if (totalSeconds <= 0) return "00:00:00";
        long hours = totalSeconds / 3600;
        long minutes = (totalSeconds % 3600) / 60;
        long seconds = totalSeconds % 60;
        return String.format("%02d:%02d:%02d", hours, minutes, seconds);
    }
}
