package com.leadgrowth.service;

import com.leadgrowth.dto.WorkloadScoreDto;
import com.leadgrowth.entity.FollowupReminder;
import com.leadgrowth.entity.Lead;
import com.leadgrowth.entity.Task;
import com.leadgrowth.entity.User;
import com.leadgrowth.repository.*;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class SmartAssignmentService {

    private final UserRepository userRepository;
    private final LeadRepository leadRepository;
    private final FollowupRepository followupRepository;
    private final TaskRepository taskRepository;
    private final CallHistoryRepository callHistoryRepository;

    public SmartAssignmentService(
            UserRepository userRepository,
            LeadRepository leadRepository,
            FollowupRepository followupRepository,
            TaskRepository taskRepository,
            CallHistoryRepository callHistoryRepository
    ) {
        this.userRepository = userRepository;
        this.leadRepository = leadRepository;
        this.followupRepository = followupRepository;
        this.taskRepository = taskRepository;
        this.callHistoryRepository = callHistoryRepository;
    }

    public List<WorkloadScoreDto> calculateWorkspaceWorkloadScores(String userEmail) {
        User requester = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<User> members = userRepository.findByWorkspaceId(requester.getWorkspace().getId());

        // Filter assignable Sales Executives (ROLE_USER)
        List<User> salesExecs = members.stream().filter(u -> {
            var roleNames = u.getRoles().stream().map(r -> r.getName().toUpperCase()).collect(Collectors.toList());
            boolean hasUser = roleNames.contains("ROLE_USER") || roleNames.contains("USER");
            boolean hasAdminOrManager = roleNames.contains("ROLE_ADMIN") || roleNames.contains("ADMIN") || roleNames.contains("ROLE_MANAGER") || roleNames.contains("MANAGER");
            return roleNames.isEmpty() || (hasUser && !hasAdminOrManager);
        }).collect(Collectors.toList());

        if (salesExecs.isEmpty()) {
            salesExecs = members;
        }

        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = LocalDate.now().atTime(LocalTime.MAX);
        LocalDate today = LocalDate.now();

        List<WorkloadScoreDto> list = new ArrayList<>();

        for (User u : salesExecs) {
            // 1. Active Leads count (status not Converted or Lost)
            List<Lead> userLeads = leadRepository.findByAssignedToIdOrderByCreatedAtDesc(u.getId());
            int activeLeads = (int) userLeads.stream()
                    .filter(l -> !"Converted".equalsIgnoreCase(l.getStatus()) && !"Lost".equalsIgnoreCase(l.getStatus()) && !"Rejected".equalsIgnoreCase(l.getStatus()))
                    .count();

            // 2. Pending Follow-ups count
            List<FollowupReminder> userFollowups = followupRepository.findByAssignedToIdOrderByScheduledAtAsc(u.getId());
            int pendingFollowups = (int) userFollowups.stream()
                    .filter(f -> "UPCOMING".equalsIgnoreCase(f.getStatus()) || "PENDING".equalsIgnoreCase(f.getStatus()))
                    .count();

            // 3. Today's Active Tasks & Overdue Tasks
            List<Task> userTasks = taskRepository.findByWorkspaceIdAndAssignedToIdOrderByCreatedAtDesc(requester.getWorkspace().getId(), u.getId());
            int todayTasks = (int) userTasks.stream()
                    .filter(t -> t.getDueDate() != null && t.getDueDate().isEqual(today) && !"COMPLETED".equalsIgnoreCase(t.getStatus()) && !"APPROVED".equalsIgnoreCase(t.getStatus()))
                    .count();

            int overdueTasks = (int) userTasks.stream()
                    .filter(t -> t.getDueDate() != null && t.getDueDate().isBefore(today) && !"COMPLETED".equalsIgnoreCase(t.getStatus()) && !"APPROVED".equalsIgnoreCase(t.getStatus()))
                    .count();

            // 4. Today's Call Time Seconds
            long todayCallSeconds = callHistoryRepository.sumDurationSecondsByUserIdAndDateRange(u.getId(), startOfDay, endOfDay);

            // Workload Score Formula:
            // Workload Score = Active Leads + Pending Followups + Today Active Tasks + (Today Call Seconds / 1800) + Overdue Tasks
            double callTimeUnits = todayCallSeconds / 1800.0;
            double score = activeLeads + pendingFollowups + todayTasks + callTimeUnits + overdueTasks;
            score = Math.round(score * 100.0) / 100.0;

            String formattedCallTime = formatSecondsToHHMMSS(todayCallSeconds);

            WorkloadScoreDto dto = new WorkloadScoreDto(
                    u.getId(),
                    u.getFullName(),
                    u.getEmail(),
                    activeLeads,
                    pendingFollowups,
                    todayTasks,
                    todayCallSeconds,
                    formattedCallTime,
                    overdueTasks,
                    score,
                    false
            );
            list.add(dto);
        }

        // Sort by workload score ascending (lowest score = least loaded = preferred)
        list.sort(Comparator.comparingDouble(WorkloadScoreDto::getWorkloadScore));

        // Mark the lowest workload user as preferred
        if (!list.isEmpty()) {
            list.get(0).setPreferredForAutoAssignment(true);
        }

        return list;
    }

    private String formatSecondsToHHMMSS(long totalSeconds) {
        if (totalSeconds <= 0) return "00:00:00";
        long hours = totalSeconds / 3600;
        long minutes = (totalSeconds % 3600) / 60;
        long seconds = totalSeconds % 60;
        return String.format("%02d:%02d:%02d", hours, minutes, seconds);
    }
}
