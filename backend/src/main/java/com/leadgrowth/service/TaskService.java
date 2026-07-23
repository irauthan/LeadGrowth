package com.leadgrowth.service;

import com.leadgrowth.dto.TaskDto;
import com.leadgrowth.entity.Task;
import com.leadgrowth.entity.User;
import com.leadgrowth.entity.TaskAssignment;
import com.leadgrowth.entity.AssignmentLog;
import com.leadgrowth.entity.Notification;
import com.leadgrowth.entity.Workspace;
import com.leadgrowth.repository.*;
import com.leadgrowth.websocket.WebSocketManager;
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
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final TaskAssignmentRepository taskAssignmentRepository;
    private final AssignmentLogRepository assignmentLogRepository;
    private final NotificationRepository notificationRepository;
    private final WebSocketManager webSocketManager;

    public TaskService(
            TaskRepository taskRepository,
            UserRepository userRepository,
            TaskAssignmentRepository taskAssignmentRepository,
            AssignmentLogRepository assignmentLogRepository,
            NotificationRepository notificationRepository,
            WebSocketManager webSocketManager
    ) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.taskAssignmentRepository = taskAssignmentRepository;
        this.assignmentLogRepository = assignmentLogRepository;
        this.notificationRepository = notificationRepository;
        this.webSocketManager = webSocketManager;
    }

    public List<TaskDto> getTasks(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        if (user.getWorkspace() == null) {
            throw new IllegalStateException("User does not belong to a workspace");
        }

        boolean isUserOnly = user.getRoles().stream()
                .anyMatch(r -> r.getName().equals("ROLE_USER")) &&
                user.getRoles().stream().noneMatch(r -> r.getName().equals("ROLE_ADMIN") || r.getName().equals("ROLE_MANAGER"));

        List<Task> tasks;
        if (isUserOnly) {
            tasks = taskRepository.findByWorkspaceIdAndAssignedToIdOrderByCreatedAtDesc(
                    user.getWorkspace().getId(), user.getId()
            );
        } else {
            tasks = taskRepository.findByWorkspaceIdOrderByCreatedAtDesc(user.getWorkspace().getId());
        }

        return tasks.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    @Transactional
    public TaskDto createTask(TaskDto dto, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        if (user.getWorkspace() == null) {
            throw new IllegalStateException("User does not belong to a workspace");
        }

        User assignedTo = null;
        String algorithmDetails = null;

        // Auto Assignment Trigger
        if (dto.getAssignedToId() != null && dto.getAssignedToId() == -1) {
            assignedTo = findBestAssignee(user.getWorkspace());
            if (assignedTo != null) {
                algorithmDetails = "Assigned via Hybrid Auto-Assignment Algorithm.";
            } else {
                algorithmDetails = "Auto-Assignment requested but no eligible users available. Kept in Queue.";
            }
        } else if (dto.getAssignedToId() != null && dto.getAssignedToId() > 0) {
            assignedTo = userRepository.findById(dto.getAssignedToId()).orElse(null);
            algorithmDetails = "Assigned manually by Creator.";
        }

        Task task = Task.builder()
                .workspace(user.getWorkspace())
                .title(dto.getTitle())
                .description(dto.getDescription())
                .assignedTo(assignedTo)
                .assignedBy(user)
                .dueDate(dto.getDueDate())
                .priority(dto.getPriority() != null ? dto.getPriority().toUpperCase() : "MEDIUM")
                .status(assignedTo != null ? "IN_PROGRESS" : "PENDING")
                .assignedAt(assignedTo != null ? LocalDateTime.now() : null)
                .build();

        Task saved = taskRepository.save(task);

        if (assignedTo != null) {
            assignedTo.setLastAssignedAt(LocalDateTime.now());
            userRepository.save(assignedTo);

            // Log assignment
            taskAssignmentRepository.save(new TaskAssignment(saved, assignedTo, user));
            assignmentLogRepository.save(new AssignmentLog(
                    user.getWorkspace(), "TASK", saved.getId(), assignedTo, algorithmDetails
            ));

            // Notify Assignee
            createAndSendNotification(assignedTo, "New Task Assigned", 
                    "You have been assigned to: \"" + saved.getTitle() + "\" (Priority: " + saved.getPriority() + ").");
        } else {
            // Log queue entry
            assignmentLogRepository.save(new AssignmentLog(
                    user.getWorkspace(), "TASK", saved.getId(), null, "Task added to queue."
            ));
        }

        TaskDto resultDto = convertToDto(saved);
        // Broadcast task creation/update to workspace
        webSocketManager.broadcastTask(user.getWorkspace().getId(), resultDto);

        return resultDto;
    }

    @Transactional
    public TaskDto updateTaskStatus(Long taskId, String status, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found"));

        boolean isUserOnly = user.getRoles().stream()
                .anyMatch(r -> r.getName().equals("ROLE_USER")) &&
                user.getRoles().stream().noneMatch(r -> r.getName().equals("ROLE_ADMIN") || r.getName().equals("ROLE_MANAGER"));

        if (isUserOnly && (task.getAssignedTo() == null || !task.getAssignedTo().getId().equals(user.getId()))) {
            throw new IllegalStateException("You can only update tasks assigned to you");
        }

        String oldStatus = task.getStatus();
        String targetStatus = status.toUpperCase().replace(" ", "_");

        // Module 6: Completed transitions to PENDING_REVIEW automatically if done by user
        if ("COMPLETED".equals(targetStatus) && isUserOnly) {
            targetStatus = "PENDING_REVIEW";
        }

        task.setStatus(targetStatus);
        Task saved = taskRepository.save(task);
        TaskDto resultDto = convertToDto(saved);

        // Notify relevant parties
        if ("PENDING_REVIEW".equals(targetStatus)) {
            // Notify managers and admin
            List<User> managers = userRepository.findByWorkspaceId(task.getWorkspace().getId()).stream()
                    .filter(u -> u.getRoles().stream().anyMatch(r -> r.getName().equals("ROLE_ADMIN") || r.getName().equals("ROLE_MANAGER")))
                    .collect(Collectors.toList());
            for (User mgr : managers) {
                createAndSendNotification(mgr, "Task Completed - Pending Review", 
                        "🔔 " + user.getFullName() + " completed Campaign Task: \"" + task.getTitle() + "\".");
            }

            // Trigger User Idle Prevention: check if there is other work in the queue
            checkQueueAndAssignToUser(user);
        }

        webSocketManager.broadcastTask(task.getWorkspace().getId(), resultDto);
        return resultDto;
    }

    @Transactional
    public TaskDto approveTask(Long taskId, String adminEmail) {
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Admin not found"));
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found"));

        boolean isAuthorized = admin.getRoles().stream().anyMatch(r -> r.getName().equals("ROLE_ADMIN") || r.getName().equals("ROLE_MANAGER"));
        if (!isAuthorized) {
            throw new IllegalStateException("Only administrators or managers can approve completed tasks");
        }

        task.setStatus("APPROVED");
        Task saved = taskRepository.save(task);
        TaskDto resultDto = convertToDto(saved);

        if (saved.getAssignedTo() != null) {
            createAndSendNotification(saved.getAssignedTo(), "Task Approved", 
                    "Your task \"" + saved.getTitle() + "\" has been approved by " + admin.getFullName() + ".");
        }

        webSocketManager.broadcastTask(task.getWorkspace().getId(), resultDto);
        return resultDto;
    }

    @Transactional
    public TaskDto rejectTask(Long taskId, String adminEmail) {
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Admin not found"));
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found"));

        boolean isAuthorized = admin.getRoles().stream().anyMatch(r -> r.getName().equals("ROLE_ADMIN") || r.getName().equals("ROLE_MANAGER"));
        if (!isAuthorized) {
            throw new IllegalStateException("Only administrators or managers can reject tasks");
        }

        task.setStatus("REJECTED");
        Task saved = taskRepository.save(task);
        TaskDto resultDto = convertToDto(saved);

        if (saved.getAssignedTo() != null) {
            createAndSendNotification(saved.getAssignedTo(), "Task Rejected", 
                    "Your task \"" + saved.getTitle() + "\" has been sent back for rework by " + admin.getFullName() + ".");
        }

        webSocketManager.broadcastTask(task.getWorkspace().getId(), resultDto);
        return resultDto;
    }

    @Transactional
    public TaskDto autoAssignTask(Long taskId, String userEmail) {
        User actor = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found"));

        User best = findBestAssignee(task.getWorkspace());
        if (best == null) {
            throw new IllegalStateException("No eligible available team members to assign this task to");
        }

        task.setAssignedTo(best);
        task.setStatus("IN_PROGRESS");
        task.setAssignedAt(LocalDateTime.now());
        task.setAssignedBy(actor);
        Task saved = taskRepository.save(task);

        best.setLastAssignedAt(LocalDateTime.now());
        userRepository.save(best);

        // Logs
        taskAssignmentRepository.save(new TaskAssignment(saved, best, actor));
        assignmentLogRepository.save(new AssignmentLog(
                task.getWorkspace(), "TASK", saved.getId(), best, "Manually triggered Auto-Assignment."
        ));

        // Notify
        createAndSendNotification(best, "New Task Assigned", 
                "You have been assigned to: \"" + saved.getTitle() + "\" (Priority: " + saved.getPriority() + ").");

        TaskDto resultDto = convertToDto(saved);
        webSocketManager.broadcastTask(task.getWorkspace().getId(), resultDto);
        return resultDto;
    }

    @Transactional
    public void deleteTask(Long taskId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found"));

        if (!task.getWorkspace().getId().equals(user.getWorkspace().getId())) {
            throw new IllegalStateException("Unauthorized");
        }

        taskRepository.delete(task);
    }

    @Transactional
    public List<TaskDto> bulkAssignTasks(List<Long> taskIds, Long userId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        
        List<TaskDto> updated = new ArrayList<>();
        for (Long id : taskIds) {
            Task task = taskRepository.findById(id).orElse(null);
            if (task != null && task.getWorkspace().getId().equals(user.getWorkspace().getId())) {
                User assignedTo = userId == -1 
                        ? findBestAssignee(user.getWorkspace())
                        : userRepository.findById(userId).orElse(null);
                
                if (assignedTo != null) {
                    task.setAssignedTo(assignedTo);
                    task.setAssignedBy(user);
                    task.setStatus("IN_PROGRESS");
                    task.setAssignedAt(LocalDateTime.now());
                    Task saved = taskRepository.save(task);

                    assignedTo.setLastAssignedAt(LocalDateTime.now());
                    userRepository.save(assignedTo);

                    taskAssignmentRepository.save(new TaskAssignment(saved, assignedTo, user));
                    assignmentLogRepository.save(new AssignmentLog(
                            user.getWorkspace(), "TASK", saved.getId(), assignedTo, "Bulk auto-assignment."
                    ));

                    createAndSendNotification(assignedTo, "New Task Assigned", 
                            "You have been assigned to: \"" + saved.getTitle() + "\" via bulk assignment.");

                    updated.add(convertToDto(saved));
                }
            }
        }
        return updated;
    }

    @Transactional
    public List<TaskDto> bulkRandomAssignTasks(List<Long> taskIds, String userEmail) {
        return bulkAssignTasks(taskIds, -1L, userEmail);
    }

    @Transactional
    public List<TaskDto> bulkUpdateStatus(List<Long> taskIds, String status, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        List<TaskDto> updated = new ArrayList<>();
        for (Long id : taskIds) {
            Task task = taskRepository.findById(id).orElse(null);
            if (task != null && task.getWorkspace().getId().equals(user.getWorkspace().getId())) {
                task.setStatus(status.toUpperCase());
                Task saved = taskRepository.save(task);
                updated.add(convertToDto(saved));
            }
        }
        return updated;
    }

    public User findBestAssignee(Workspace workspace) {
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
                // Check workload threshold
                long activeTasksCount = taskRepository.countByAssignedToAndStatusIn(u, 
                        List.of("PENDING", "IN_PROGRESS", "PENDING_REVIEW", "Pending", "In_Progress", "In Progress"));
                if (activeTasksCount < 5) {
                    eligibleUsers.add(u);
                }
            }
        }

        if (eligibleUsers.isEmpty()) {
            return null;
        }

        // Step 2: Workload Balancing (Least Workload)
        long minWorkload = Long.MAX_VALUE;
        List<User> minWorkloadUsers = new ArrayList<>();

        for (User u : eligibleUsers) {
            long workload = taskRepository.countByAssignedToAndStatusIn(u, 
                    List.of("PENDING", "IN_PROGRESS", "PENDING_REVIEW", "Pending", "In_Progress", "In Progress"));
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

    public void checkQueueAndAssignToUser(User user) {
        if (user == null || !"AVAILABLE".equalsIgnoreCase(user.getAvailabilityStatus())) {
            return;
        }

        // Find pending tasks in the workspace that are unassigned
        List<Task> pendingTasks = taskRepository.findByWorkspaceIdAndAssignedToIsNullAndStatusIn(
                user.getWorkspace().getId(), List.of("PENDING", "Pending")
        );

        if (pendingTasks.isEmpty()) {
            return;
        }

        // Sort by priority (URGENT -> HIGH -> MEDIUM -> LOW) then oldest createdAt
        pendingTasks.sort((t1, t2) -> {
            int p1 = getPriorityWeight(t1.getPriority());
            int p2 = getPriorityWeight(t2.getPriority());
            if (p1 != p2) {
                return Integer.compare(p2, p1); // descending
            }
            return t1.getCreatedAt().compareTo(t2.getCreatedAt()); // ascending
        });

        // Select highest priority task
        Task targetTask = pendingTasks.get(0);

        if (targetTask != null) {
            targetTask.setAssignedTo(user);
            targetTask.setStatus("IN_PROGRESS");
            targetTask.setAssignedAt(LocalDateTime.now());
            taskRepository.save(targetTask);

            user.setLastAssignedAt(LocalDateTime.now());
            userRepository.save(user);

            taskAssignmentRepository.save(new TaskAssignment(targetTask, user, null));
            assignmentLogRepository.save(new AssignmentLog(
                    user.getWorkspace(), "TASK", targetTask.getId(), user, "Auto assigned via User Idle Prevention."
            ));

            createAndSendNotification(user, "New Task Assigned (Auto-Assigned)", 
                    "You have been auto-assigned task: \"" + targetTask.getTitle() + "\" via Idle Prevention queue sweep.");
        }
    }

    private int getPriorityWeight(String priority) {
        if (priority == null) return 0;
        switch (priority.toUpperCase()) {
            case "URGENT": return 4;
            case "HIGH": return 3;
            case "MEDIUM": return 2;
            case "LOW": return 1;
            default: return 0;
        }
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

        // Convert to DTO/map for WebSocket transmission
        Map<String, Object> wsMsg = new HashMap<>();
        wsMsg.put("id", notification.getId());
        wsMsg.put("title", notification.getTitle());
        wsMsg.put("message", notification.getMessage());
        wsMsg.put("isRead", notification.getIsRead());
        wsMsg.put("createdAt", LocalDateTime.now().toString());

        webSocketManager.broadcastNotification(recipient.getId(), wsMsg);
        webSocketManager.broadcastWorkspaceNotification(recipient.getWorkspace().getId(), wsMsg);
    }

    @Transactional
    public void handleUserOffline(Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return;
        List<Task> openTasks = taskRepository.findByWorkspaceIdAndAssignedToIdAndStatusIn(
                user.getWorkspace().getId(), user.getId(), List.of("PENDING", "IN_PROGRESS", "Pending", "In_Progress", "In Progress")
        );
        for (Task task : openTasks) {
            task.setAssignedTo(null);
            task.setStatus("PENDING");
            task.setAssignedAt(null);
            taskRepository.save(task);
            
            assignmentLogRepository.save(new AssignmentLog(
                    user.getWorkspace(), "TASK", task.getId(), null, 
                    "Task returned to queue because assignee \"" + user.getFullName() + "\" went " + user.getAvailabilityStatus() + "."
            ));

            // Auto-assign immediately if possible
            User best = findBestAssignee(user.getWorkspace());
            if (best != null) {
                task.setAssignedTo(best);
                task.setStatus("IN_PROGRESS");
                task.setAssignedAt(LocalDateTime.now());
                taskRepository.save(task);
                best.setLastAssignedAt(LocalDateTime.now());
                userRepository.save(best);
                
                taskAssignmentRepository.save(new TaskAssignment(task, best, null));
                assignmentLogRepository.save(new AssignmentLog(
                        user.getWorkspace(), "TASK", task.getId(), best, 
                        "Auto-reassigned due to previous assignee going " + user.getAvailabilityStatus() + "."
                ));

                createAndSendNotification(best, "New Task Assigned (Auto-Reassigned)", 
                        "Task \"" + task.getTitle() + "\" was auto-reassigned to you because the previous assignee went offline/on leave.");
            }
        }
    }

    @Transactional
    public TaskDto suspendTask(Long taskId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found"));

        if (task.getAssignedTo() == null || !task.getAssignedTo().getId().equals(user.getId())) {
            throw new IllegalStateException("You can only suspend tasks assigned to you");
        }

        task.setAssignedTo(null);
        task.setStatus("SUSPENDED");
        task.setAssignedAt(null);
        Task saved = taskRepository.save(task);

        assignmentLogRepository.save(new AssignmentLog(
                user.getWorkspace(), "TASK", saved.getId(), null,
                "Task suspended by user " + user.getFullName() + " due to heavy workload."
        ));

        List<User> managers = userRepository.findByWorkspaceId(task.getWorkspace().getId()).stream()
                .filter(u -> u.getRoles().stream().anyMatch(r -> r.getName().equals("ROLE_ADMIN") || r.getName().equals("ROLE_MANAGER")))
                .collect(Collectors.toList());
        for (User mgr : managers) {
            createAndSendNotification(mgr, "⚠️ Task Suspended (Workload Alert)",
                    user.getFullName() + " suspended task: \"" + task.getTitle() + "\" due to heavy workload. Please reassign.");
        }

        TaskDto resultDto = convertToDto(saved);
        webSocketManager.broadcastTask(task.getWorkspace().getId(), resultDto);
        return resultDto;
    }

    @Transactional
    public TaskDto reassignTask(Long taskId, Long newUserId, String managerEmail) {
        User manager = userRepository.findByEmail(managerEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Manager not found"));
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found"));

        boolean isAuthorized = manager.getRoles().stream().anyMatch(r -> r.getName().equals("ROLE_ADMIN") || r.getName().equals("ROLE_MANAGER"));
        if (!isAuthorized) {
            throw new IllegalStateException("Only admins or managers can reassign tasks");
        }

        User newAssignee = newUserId == -1
                ? findBestAssignee(task.getWorkspace())
                : userRepository.findById(newUserId).orElse(null);

        if (newAssignee == null) {
            throw new IllegalStateException("Selected team member not found or unavailable");
        }

        task.setAssignedTo(newAssignee);
        task.setAssignedBy(manager);
        task.setStatus("IN_PROGRESS");
        task.setAssignedAt(LocalDateTime.now());
        Task saved = taskRepository.save(task);

        newAssignee.setLastAssignedAt(LocalDateTime.now());
        userRepository.save(newAssignee);

        taskAssignmentRepository.save(new TaskAssignment(saved, newAssignee, manager));
        assignmentLogRepository.save(new AssignmentLog(
                task.getWorkspace(), "TASK", saved.getId(), newAssignee,
                "Reassigned by manager " + manager.getFullName() + "."
        ));

        createAndSendNotification(newAssignee, "Task Reassigned To You",
                "Manager " + manager.getFullName() + " reassigned task: \"" + saved.getTitle() + "\" to you.");

        TaskDto resultDto = convertToDto(saved);
        webSocketManager.broadcastTask(task.getWorkspace().getId(), resultDto);
        return resultDto;
    }

    private TaskDto convertToDto(Task task) {
        return TaskDto.builder()
                .id(task.getId())
                .title(task.getTitle())
                .description(task.getDescription())
                .assignedToId(task.getAssignedTo() != null ? task.getAssignedTo().getId() : null)
                .assignedToName(task.getAssignedTo() != null ? task.getAssignedTo().getFullName() : "Unassigned")
                .assignedById(task.getAssignedBy() != null ? task.getAssignedBy().getId() : null)
                .assignedByName(task.getAssignedBy() != null ? task.getAssignedBy().getFullName() : "System")
                .dueDate(task.getDueDate())
                .priority(task.getPriority())
                .status(task.getStatus())
                .createdAt(task.getCreatedAt())
                .build();
    }
}
