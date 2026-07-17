package com.leadgrowth.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class TaskDto {
    private Long id;
    private String title;
    private String description;
    private Long assignedToId;
    private String assignedToName;
    private LocalDate dueDate;
    private String priority; // Low, Medium, High
    private String status; // Pending, In_Progress, Completed
    private LocalDateTime createdAt;

    public TaskDto() {}

    public TaskDto(Long id, String title, String description, Long assignedToId, String assignedToName, LocalDate dueDate, String priority, String status, LocalDateTime createdAt) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.assignedToId = assignedToId;
        this.assignedToName = assignedToName;
        this.dueDate = dueDate;
        this.priority = priority;
        this.status = status;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Long getAssignedToId() { return assignedToId; }
    public void setAssignedToId(Long assignedToId) { this.assignedToId = assignedToId; }

    public String getAssignedToName() { return assignedToName; }
    public void setAssignedToName(String assignedToName) { this.assignedToName = assignedToName; }

    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    // Builder
    public static TaskDtoBuilder builder() {
        return new TaskDtoBuilder();
    }

    public static class TaskDtoBuilder {
        private Long id;
        private String title;
        private String description;
        private Long assignedToId;
        private String assignedToName;
        private LocalDate dueDate;
        private String priority;
        private String status;
        private LocalDateTime createdAt;

        TaskDtoBuilder() {}

        public TaskDtoBuilder id(Long id) { this.id = id; return this; }
        public TaskDtoBuilder title(String title) { this.title = title; return this; }
        public TaskDtoBuilder description(String description) { this.description = description; return this; }
        public TaskDtoBuilder assignedToId(Long assignedToId) { this.assignedToId = assignedToId; return this; }
        public TaskDtoBuilder assignedToName(String assignedToName) { this.assignedToName = assignedToName; return this; }
        public TaskDtoBuilder dueDate(LocalDate dueDate) { this.dueDate = dueDate; return this; }
        public TaskDtoBuilder priority(String priority) { this.priority = priority; return this; }
        public TaskDtoBuilder status(String status) { this.status = status; return this; }
        public TaskDtoBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public TaskDto build() {
            return new TaskDto(id, title, description, assignedToId, assignedToName, dueDate, priority, status, createdAt);
        }
    }
}
