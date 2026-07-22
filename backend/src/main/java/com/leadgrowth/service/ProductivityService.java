package com.leadgrowth.service;

import com.leadgrowth.dto.TeamProductivityDto;
import com.leadgrowth.entity.User;
import com.leadgrowth.entity.UserProductivity;
import com.leadgrowth.entity.Workspace;
import com.leadgrowth.repository.*;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProductivityService {

    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final LeadRepository leadRepository;
    private final UserProductivityRepository userProductivityRepository;

    public ProductivityService(
            UserRepository userRepository,
            TaskRepository taskRepository,
            LeadRepository leadRepository,
            UserProductivityRepository userProductivityRepository
    ) {
        this.userRepository = userRepository;
        this.taskRepository = taskRepository;
        this.leadRepository = leadRepository;
        this.userProductivityRepository = userProductivityRepository;
    }

    public List<TeamProductivityDto> getTeamProductivity(String email) {
        User actor = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        if (actor.getWorkspace() == null) {
            throw new IllegalStateException("User is not associated with a workspace");
        }

        List<User> members = userRepository.findByWorkspaceId(actor.getWorkspace().getId());
        List<TeamProductivityDto> dtos = new ArrayList<>();

        for (User u : members) {
            if ("SUSPENDED".equalsIgnoreCase(u.getStatus())) {
                continue;
            }
            dtos.add(calculateUserProductivityDto(u));
        }

        return dtos;
    }

    @Transactional
    public void generateDailyScorecard() {
        List<User> users = userRepository.findAll();
        LocalDate today = LocalDate.now();

        for (User u : users) {
            if (u.getWorkspace() == null || "SUSPENDED".equalsIgnoreCase(u.getStatus())) {
                continue;
            }

            TeamProductivityDto dto = calculateUserProductivityDto(u);

            UserProductivity record = userProductivityRepository
                    .findByWorkspaceIdAndUserIdAndDate(u.getWorkspace().getId(), u.getId(), today)
                    .orElse(new UserProductivity());

            record.setWorkspace(u.getWorkspace());
            record.setUser(u);
            record.setCompletedTasksCount(dto.getCompletedTasks());
            record.setCompletedLeadsCount(dto.getCompletedLeads());
            record.setConversionRate(dto.getConversionRate());
            record.setAverageResponseTime(dto.getAverageResponseTime());
            record.setProductivityScore(dto.getScore());
            record.setDate(today);

            userProductivityRepository.save(record);
        }
    }

    public TeamProductivityDto calculateUserProductivityDto(User u) {
        // completed tasks count (APPROVED or COMPLETED status)
        long completedTasks = taskRepository.countByAssignedToAndStatusIn(u, List.of("COMPLETED", "APPROVED", "Completed"));
        
        // total assigned tasks count
        long totalTasks = taskRepository.countByAssignedToAndStatusIn(u, List.of("PENDING", "IN_PROGRESS", "COMPLETED", "PENDING_REVIEW", "APPROVED", "REJECTED", "Pending", "In_Progress", "Completed"));

        // completed leads count (Converted status)
        long completedLeads = leadRepository.countByAssignedToAndStatusIn(u, List.of("Converted", "CONVERTED"));
        
        // total leads count
        long totalLeads = leadRepository.countByAssignedToAndStatusIn(u, List.of("New", "Contacted", "Qualified", "Converted", "Rejected", "NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "REJECTED"));

        double conversionRate = totalLeads > 0 ? (double) completedLeads / totalLeads : 0.0;
        
        // Calculate a simulated average response time (e.g. baseline of 3 hours, reduced slightly by completed tasks/leads efficiency)
        double avgResponseTime = 4.0;
        if (completedTasks + completedLeads > 0) {
            avgResponseTime = Math.max(1.0, 4.0 - (0.1 * (completedTasks + completedLeads)));
        }

        // Productivity Score formula:
        // Tasks = 35% weight, Leads = 35% weight, Conversion = 30% weight
        double taskScore = totalTasks > 0 ? ((double) completedTasks / totalTasks) * 100 : 0.0;
        double leadScore = totalLeads > 0 ? ((double) completedLeads / totalLeads) * 100 : 0.0;
        double conversionScore = conversionRate * 100;

        double score = 0.0;
        if (totalTasks > 0 && totalLeads > 0) {
            score = (taskScore * 0.35) + (leadScore * 0.35) + (conversionScore * 0.30);
        } else if (totalTasks > 0) {
            score = taskScore;
        } else if (totalLeads > 0) {
            score = (leadScore * 0.6) + (conversionScore * 0.4);
        } else {
            // idle/available or fresh user base score
            score = "AVAILABLE".equals(u.getAvailabilityStatus()) ? 50.0 : 30.0;
        }

        // Round score to 1 decimal place
        score = Math.round(score * 10.0) / 10.0;
        score = Math.min(100.0, Math.max(0.0, score));

        String category = "Needs Improvement";
        if (score >= 80.0) {
            category = "Top Performer";
        } else if (score >= 50.0) {
            category = "Average Performer";
        }

        return new TeamProductivityDto(
                u.getId(),
                u.getFullName(),
                (int) completedTasks,
                (int) completedLeads,
                conversionRate,
                avgResponseTime,
                score,
                category
        );
    }
}
