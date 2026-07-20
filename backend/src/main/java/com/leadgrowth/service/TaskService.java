package com.leadgrowth.service;

import com.leadgrowth.dto.TaskDto;
import com.leadgrowth.entity.Task;
import com.leadgrowth.entity.User;
import com.leadgrowth.repository.TaskRepository;
import com.leadgrowth.repository.UserRepository;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    public TaskService(TaskRepository taskRepository, UserRepository userRepository) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
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
        if (dto.getAssignedToId() != null && dto.getAssignedToId() > 0) {
            assignedTo = userRepository.findById(dto.getAssignedToId()).orElse(null);
        } else if (dto.getAssignedToId() != null && dto.getAssignedToId() == -1) {
            assignedTo = findEqualDistributionAssignee(user.getWorkspace().getId());
        }

        Task task = Task.builder()
                .workspace(user.getWorkspace())
                .title(dto.getTitle())
                .description(dto.getDescription())
                .assignedTo(assignedTo)
                .assignedBy(user)
                .dueDate(dto.getDueDate())
                .priority(dto.getPriority())
                .status("Pending")
                .build();

        return convertToDto(taskRepository.save(task));
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

        task.setStatus(status);
        return convertToDto(taskRepository.save(task));
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
        User assignedTo = userId == -1 
                ? findEqualDistributionAssignee(user.getWorkspace().getId())
                : userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));

        List<TaskDto> updated = new ArrayList<>();
        for (Long id : taskIds) {
            Task task = taskRepository.findById(id).orElse(null);
            if (task != null && task.getWorkspace().getId().equals(user.getWorkspace().getId())) {
                task.setAssignedTo(assignedTo);
                task.setAssignedBy(user);
                updated.add(convertToDto(taskRepository.save(task)));
            }
        }
        return updated;
    }

    @Transactional
    public List<TaskDto> bulkRandomAssignTasks(List<Long> taskIds, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        List<TaskDto> updated = new ArrayList<>();
        for (Long id : taskIds) {
            Task task = taskRepository.findById(id).orElse(null);
            if (task != null && task.getWorkspace().getId().equals(user.getWorkspace().getId())) {
                User assignedTo = findEqualDistributionAssignee(user.getWorkspace().getId());
                task.setAssignedTo(assignedTo);
                task.setAssignedBy(user);
                updated.add(convertToDto(taskRepository.save(task)));
            }
        }
        return updated;
    }

    @Transactional
    public List<TaskDto> bulkUpdateStatus(List<Long> taskIds, String status, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        List<TaskDto> updated = new ArrayList<>();
        for (Long id : taskIds) {
            Task task = taskRepository.findById(id).orElse(null);
            if (task != null && task.getWorkspace().getId().equals(user.getWorkspace().getId())) {
                task.setStatus(status);
                updated.add(convertToDto(taskRepository.save(task)));
            }
        }
        return updated;
    }

    private User findEqualDistributionAssignee(Long workspaceId) {
        List<User> members = userRepository.findByWorkspaceId(workspaceId);
        List<User> activeMembers = members.stream()
                .filter(u -> !"SUSPENDED".equalsIgnoreCase(u.getStatus()))
                .collect(Collectors.toList());

        if (activeMembers.isEmpty()) {
            return null;
        }

        User bestMember = activeMembers.get(0);
        long minCount = Long.MAX_VALUE;
        for (User u : activeMembers) {
            long count = taskRepository.countByAssignedToAndStatusIn(u, List.of("Pending", "In_Progress", "In Progress"));
            if (count < minCount) {
                minCount = count;
                bestMember = u;
            }
        }
        return bestMember;
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
