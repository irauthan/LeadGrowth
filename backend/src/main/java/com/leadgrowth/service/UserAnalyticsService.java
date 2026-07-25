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
public class UserAnalyticsService {

    private final UserRepository userRepository;
    private final LeadRepository leadRepository;
    private final TaskRepository taskRepository;
    private final FollowupRepository followupRepository;

    public UserAnalyticsService(
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

    public Map<String, Object> getUserDashboardKpis(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Long userId = user.getId();
        Long workspaceId = user.getWorkspace().getId();

        List<Lead> myLeads = leadRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceId).stream()
                .filter(l -> userId.equals(l.getAssignedToId()))
                .collect(Collectors.toList());

        List<Task> myTasks = taskRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceId).stream()
                .filter(t -> t.getAssignedTo() != null && userId.equals(t.getAssignedTo().getId()))
                .collect(Collectors.toList());

        long assignedLeadsCount = myLeads.size();
        
        long completedTasksCount = myTasks.stream().filter(t -> 
            "Completed".equalsIgnoreCase(t.getStatus()) || 
            "APPROVED".equalsIgnoreCase(t.getStatus()) || 
            "PENDING_REVIEW".equalsIgnoreCase(t.getStatus())
        ).count();

        long activeTasksCount = myTasks.size() - completedTasksCount;
        long conversionsCount = myLeads.stream().filter(l -> "Converted".equalsIgnoreCase(l.getStatus())).count();

        long pendingFollowupsCount = followupRepository.findByWorkspaceIdOrderByScheduledAtAsc(workspaceId).stream()
                .filter(f -> f.getLead() != null && userId.equals(f.getLead().getAssignedToId()) && !"COMPLETED".equalsIgnoreCase(f.getStatus()))
                .count();

        double personalRevenue = conversionsCount * 2500.0;
        double conversionRate = assignedLeadsCount > 0 ? (conversionsCount * 100.0 / assignedLeadsCount) : 0.0;
        double taskCompletionRate = (myTasks.size() > 0) ? (completedTasksCount * 100.0 / myTasks.size()) : 100.0;

        Map<String, Object> map = new HashMap<>();
        map.put("myAssignedLeads", assignedLeadsCount);
        map.put("myActiveTasks", Math.max(0, activeTasksCount));
        map.put("myCompletedTasks", completedTasksCount);
        map.put("myPendingFollowups", pendingFollowupsCount);
        map.put("myConversions", conversionsCount);
        map.put("myRevenueContribution", personalRevenue);
        map.put("conversionRate", Math.round(conversionRate * 10.0) / 10.0);
        map.put("taskCompletionRate", Math.round(taskCompletionRate * 10.0) / 10.0);
        map.put("productivityScore", 92);
        map.put("averageResponseTimeHours", 1.8);
        return map;
    }

    public Map<String, Object> getUserAnalytics(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Long userId = user.getId();
        Long workspaceId = user.getWorkspace().getId();

        List<Lead> myLeads = leadRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceId).stream()
                .filter(l -> userId.equals(l.getAssignedToId()))
                .collect(Collectors.toList());

        List<Task> myTasks = taskRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceId).stream()
                .filter(t -> t.getAssignedTo() != null && userId.equals(t.getAssignedTo().getId()))
                .collect(Collectors.toList());

        // Status counts safely
        Map<String, Long> statusDistribution = new HashMap<>();
        statusDistribution.put("New", myLeads.stream().filter(l -> "New".equalsIgnoreCase(l.getStatus())).count());
        statusDistribution.put("Contacted", myLeads.stream().filter(l -> "Contacted".equalsIgnoreCase(l.getStatus())).count());
        statusDistribution.put("Interested", myLeads.stream().filter(l -> "Interested".equalsIgnoreCase(l.getStatus())).count());
        statusDistribution.put("Follow-Up", myLeads.stream().filter(l -> "Follow-Up".equalsIgnoreCase(l.getStatus())).count());
        statusDistribution.put("Qualified", myLeads.stream().filter(l -> "Qualified".equalsIgnoreCase(l.getStatus())).count());
        statusDistribution.put("Converted", myLeads.stream().filter(l -> "Converted".equalsIgnoreCase(l.getStatus())).count());
        statusDistribution.put("Lost", myLeads.stream().filter(l -> "Lost".equalsIgnoreCase(l.getStatus()) || "Rejected".equalsIgnoreCase(l.getStatus())).count());

        long assignedCount = myLeads.size();
        long contactedCount = statusDistribution.getOrDefault("Contacted", 0L) + statusDistribution.getOrDefault("Interested", 0L) + statusDistribution.getOrDefault("Follow-Up", 0L) + statusDistribution.getOrDefault("Qualified", 0L) + statusDistribution.getOrDefault("Converted", 0L);
        long qualifiedCount = statusDistribution.getOrDefault("Qualified", 0L) + statusDistribution.getOrDefault("Converted", 0L);
        long convertedCount = statusDistribution.getOrDefault("Converted", 0L);

        List<Map<String, Object>> funnel = new ArrayList<>();
        funnel.add(createFunnelStage("Assigned Leads", assignedCount));
        funnel.add(createFunnelStage("Contacted", contactedCount));
        funnel.add(createFunnelStage("Qualified", qualifiedCount));
        funnel.add(createFunnelStage("Converted", convertedCount));

        // Task Breakdown
        long completedTasks = myTasks.stream().filter(t -> "Completed".equalsIgnoreCase(t.getStatus()) || "APPROVED".equalsIgnoreCase(t.getStatus()) || "PENDING_REVIEW".equalsIgnoreCase(t.getStatus())).count();
        long activeTasks = myTasks.size() - completedTasks;

        Map<String, Long> taskAnalytics = new HashMap<>();
        taskAnalytics.put("Active Tasks", Math.max(0, activeTasks));
        taskAnalytics.put("Completed Tasks", completedTasks);
        taskAnalytics.put("Pending Tasks", myTasks.stream().filter(t -> "Pending".equalsIgnoreCase(t.getStatus())).count());

        Map<String, Object> map = new HashMap<>();
        map.put("kpis", getUserDashboardKpis(email));
        map.put("statusDistribution", statusDistribution);
        map.put("funnel", funnel);
        map.put("taskAnalytics", taskAnalytics);
        return map;
    }

    private Map<String, Object> createFunnelStage(String stage, long count) {
        Map<String, Object> map = new HashMap<>();
        map.put("stage", stage);
        map.put("count", count);
        return map;
    }
}
