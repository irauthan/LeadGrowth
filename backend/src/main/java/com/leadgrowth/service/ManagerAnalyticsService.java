package com.leadgrowth.service;

import com.leadgrowth.entity.Lead;
import com.leadgrowth.entity.Task;
import com.leadgrowth.entity.User;
import com.leadgrowth.repository.FollowupRepository;
import com.leadgrowth.repository.LeadRepository;
import com.leadgrowth.repository.TaskRepository;
import com.leadgrowth.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class ManagerAnalyticsService {

    private final UserRepository userRepository;
    private final LeadRepository leadRepository;
    private final TaskRepository taskRepository;
    private final FollowupRepository followupRepository;

    public ManagerAnalyticsService(
            UserRepository userRepository,
            LeadRepository leadRepository,
            TaskRepository taskRepository,
            FollowupRepository followupRepository
    ) {
        this.userRepository = userRepository;
        this.leadRepository = leadRepository;
        this.taskRepository = taskRepository;
        this.followupRepository = followupRepository;
    }

    public Map<String, Object> getManagerDashboardData(String email) {
        User manager = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Long workspaceId = manager.getWorkspace().getId();

        List<Lead> teamLeads = leadRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceId);
        List<Task> teamTasks = taskRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceId);
        List<User> teamMembers = userRepository.findByWorkspaceId(workspaceId);

        long totalLeads = teamLeads.size();
        long activeLeads = teamLeads.stream().filter(l -> !"Converted".equalsIgnoreCase(l.getStatus()) && !"Lost".equalsIgnoreCase(l.getStatus())).count();
        long convertedLeads = teamLeads.stream().filter(l -> "Converted".equalsIgnoreCase(l.getStatus())).count();
        long pendingLeads = teamLeads.stream().filter(l -> "New".equalsIgnoreCase(l.getStatus()) || l.getAssignedToId() == null).count();

        long totalTasks = teamTasks.size();
        long completedTasks = teamTasks.stream().filter(t -> "Completed".equalsIgnoreCase(t.getStatus())).count();
        long overdueTasks = teamTasks.stream().filter(t -> !"Completed".equalsIgnoreCase(t.getStatus()) && t.getDueDate() != null && t.getDueDate().isBefore(java.time.LocalDate.now())).count();

        double teamConversionRate = totalLeads > 0 ? (convertedLeads * 100.0 / totalLeads) : 0.0;
        double teamProductivityScore = totalTasks > 0 ? (completedTasks * 100.0 / totalTasks) : 100.0;

        // Leaderboard
        List<Map<String, Object>> leaderboard = new ArrayList<>();
        for (User m : teamMembers) {
            long mLeads = teamLeads.stream().filter(l -> m.getId().equals(l.getAssignedToId())).count();
            long mConversions = teamLeads.stream().filter(l -> m.getId().equals(l.getAssignedToId()) && "Converted".equalsIgnoreCase(l.getStatus())).count();
            long mTasksDone = teamTasks.stream().filter(t -> t.getAssignedTo() != null && m.getId().equals(t.getAssignedTo().getId()) && "Completed".equalsIgnoreCase(t.getStatus())).count();

            Map<String, Object> memberStats = new HashMap<>();
            memberStats.put("id", m.getId());
            memberStats.put("fullName", m.getFullName());
            memberStats.put("email", m.getEmail());
            memberStats.put("designation", m.getDesignation() != null ? m.getDesignation() : "Specialist");
            memberStats.put("status", m.getStatus());
            memberStats.put("availabilityStatus", m.getAvailabilityStatus() != null ? m.getAvailabilityStatus() : "AVAILABLE");
            memberStats.put("assignedLeads", mLeads);
            memberStats.put("conversions", mConversions);
            memberStats.put("completedTasks", mTasksDone);
            double mConvRate = mLeads > 0 ? (mConversions * 100.0 / mLeads) : 0.0;
            memberStats.put("conversionRate", Math.round(mConvRate * 10.0) / 10.0);
            memberStats.put("productivityScore", 90 + (mConversions * 2));
            leaderboard.add(memberStats);
        }

        // Sort leaderboard by conversions descending
        leaderboard.sort((a, b) -> Long.compare((long) b.get("conversions"), (long) a.get("conversions")));

        Map<String, Object> map = new HashMap<>();
        map.put("teamLeads", totalLeads);
        map.put("activeLeads", activeLeads);
        map.put("convertedLeads", convertedLeads);
        map.put("pendingLeads", pendingLeads);
        map.put("teamTasks", totalTasks);
        map.put("completedTasks", completedTasks);
        map.put("overdueTasks", overdueTasks);
        map.put("teamConversionRate", Math.round(teamConversionRate * 10.0) / 10.0);
        map.put("teamProductivityScore", Math.round(teamProductivityScore * 10.0) / 10.0);
        map.put("leaderboard", leaderboard);
        map.put("unassignedQueue", teamLeads.stream().filter(l -> l.getAssignedToId() == null || "IN_QUEUE".equalsIgnoreCase(l.getQueueStatus())).collect(Collectors.toList()));
        return map;
    }

    public Map<String, Object> getManagerAnalytics(String email) {
        User manager = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Long workspaceId = manager.getWorkspace().getId();

        List<Lead> teamLeads = leadRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceId);
        List<Task> teamTasks = taskRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceId);

        Map<String, Long> statusDistribution = new HashMap<>();
        statusDistribution.put("New", teamLeads.stream().filter(l -> "New".equalsIgnoreCase(l.getStatus())).count());
        statusDistribution.put("Interaction", teamLeads.stream().filter(l -> "Interaction".equalsIgnoreCase(l.getStatus()) || "Contacted".equalsIgnoreCase(l.getStatus())).count());
        statusDistribution.put("Qualified", teamLeads.stream().filter(l -> "Qualified".equalsIgnoreCase(l.getStatus())).count());
        statusDistribution.put("Converted", teamLeads.stream().filter(l -> "Converted".equalsIgnoreCase(l.getStatus())).count());

        List<Map<String, Object>> funnel = new ArrayList<>();
        funnel.add(createFunnelStage("Total Team Leads", teamLeads.size()));
        funnel.add(createFunnelStage("Interaction", statusDistribution.get("Interaction") + statusDistribution.get("Qualified") + statusDistribution.get("Converted")));
        funnel.add(createFunnelStage("Qualified", statusDistribution.get("Qualified") + statusDistribution.get("Converted")));
        funnel.add(createFunnelStage("Converted", statusDistribution.get("Converted")));

        Map<String, Object> map = new HashMap<>();
        map.put("kpis", getManagerDashboardData(email));
        map.put("statusDistribution", statusDistribution);
        map.put("funnel", funnel);
        return map;
    }

    private Map<String, Object> createFunnelStage(String stage, long count) {
        Map<String, Object> map = new HashMap<>();
        map.put("stage", stage);
        map.put("count", count);
        return map;
    }
}
