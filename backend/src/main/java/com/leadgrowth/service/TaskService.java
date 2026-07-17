package com.leadgrowth.service;

import com.leadgrowth.dto.TaskDto;
import com.leadgrowth.entity.Task;
import com.leadgrowth.entity.User;
import com.leadgrowth.repository.TaskRepository;
import com.leadgrowth.repository.UserRepository;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
        if (dto.getAssignedToId() != null) {
            assignedTo = userRepository.findById(dto.getAssignedToId()).orElse(null);
        }

        Task task = Task.builder()
                .workspace(user.getWorkspace())
                .title(dto.getTitle())
                .description(dto.getDescription())
                .assignedTo(assignedTo)
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

        // Check ownership if ROLE_USER
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

    private TaskDto convertToDto(Task task) {
        return TaskDto.builder()
                .id(task.getId())
                .title(task.getTitle())
                .description(task.getDescription())
                .assignedToId(task.getAssignedTo() != null ? task.getAssignedTo().getId() : null)
                .assignedToName(task.getAssignedTo() != null ? task.getAssignedTo().getFullName() : "Unassigned")
                .dueDate(task.getDueDate())
                .priority(task.getPriority())
                .status(task.getStatus())
                .createdAt(task.getCreatedAt())
                .build();
    }
}
