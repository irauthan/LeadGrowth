package com.leadgrowth.scheduler;

import com.leadgrowth.entity.User;
import com.leadgrowth.repository.UserRepository;
import com.leadgrowth.service.TaskService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class AutoReassignmentScheduler {

    private static final Logger logger = LoggerFactory.getLogger(AutoReassignmentScheduler.class);
    private final UserRepository userRepository;
    private final TaskService taskService;

    public AutoReassignmentScheduler(UserRepository userRepository, TaskService taskService) {
        this.userRepository = userRepository;
        this.taskService = taskService;
    }

    // Runs every 1 minute
    @Scheduled(fixedRate = 60000)
    public void sweepAndReassignBlockedTasks() {
        logger.debug("Sweep: Checking for tasks blocked by OFFLINE or ON_LEAVE users...");
        List<User> users = userRepository.findAll();
        for (User u : users) {
            if ("SUSPENDED".equalsIgnoreCase(u.getStatus())) {
                continue;
            }
            String avail = u.getAvailabilityStatus();
            if ("OFFLINE".equalsIgnoreCase(avail) || "ON_LEAVE".equalsIgnoreCase(avail)) {
                if (u.getLastActiveAt() == null || u.getLastActiveAt().isBefore(java.time.LocalDateTime.now().minusMinutes(5))) {
                    try {
                        taskService.handleUserOffline(u.getId());
                    } catch (Exception e) {
                        logger.error("Failed to sweep/reassign tasks for user ID: " + u.getId(), e);
                    }
                }
            }
        }
    }
}
