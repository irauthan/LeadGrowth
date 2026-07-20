package com.leadgrowth.controller;

import com.leadgrowth.dto.TaskDto;
import com.leadgrowth.service.TaskService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping
    public ResponseEntity<List<TaskDto>> getTasks() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(taskService.getTasks(email));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<TaskDto> createTask(@Valid @RequestBody TaskDto dto) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(taskService.createTask(dto, email));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<TaskDto> updateTaskStatus(
            @PathVariable Long id,
            @RequestParam String status
    ) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(taskService.updateTaskStatus(id, status, email));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        taskService.deleteTask(id, email);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/bulk-assign")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<List<TaskDto>> bulkAssign(
            @RequestParam List<Long> taskIds,
            @RequestParam Long userId
    ) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(taskService.bulkAssignTasks(taskIds, userId, email));
    }

    @PostMapping("/bulk-random-assign")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<List<TaskDto>> bulkRandomAssign(@RequestParam List<Long> taskIds) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(taskService.bulkRandomAssignTasks(taskIds, email));
    }

    @PostMapping("/bulk-status")
    public ResponseEntity<List<TaskDto>> bulkStatus(
            @RequestParam List<Long> taskIds,
            @RequestParam String status
    ) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(taskService.bulkUpdateStatus(taskIds, status, email));
    }
}
