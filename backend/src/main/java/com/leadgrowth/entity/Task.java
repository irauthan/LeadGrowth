package com.leadgrowth.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "tasks")
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to_id")
    private User assignedTo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_by_id")
    private User assignedBy;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(length = 20)
    private String priority; // Low, Medium, High, Urgent

    @Column(length = 20)
    private String status; // Pending, In_Progress, Completed, etc.

    @Column(name = "assigned_at")
    private LocalDateTime assignedAt;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    // Constructors
    public Task() {}

    public Task(Long id, Workspace workspace, String title, String description, User assignedTo, User assignedBy, LocalDate dueDate, String priority, String status, LocalDateTime assignedAt, LocalDateTime createdAt) {
        this.id = id;
        this.workspace = workspace;
        this.title = title;
        this.description = description;
        this.assignedTo = assignedTo;
        this.assignedBy = assignedBy;
        this.dueDate = dueDate;
        this.priority = priority;
        this.status = status;
        this.assignedAt = assignedAt;
        this.createdAt = createdAt;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Workspace getWorkspace() { return workspace; }
    public void setWorkspace(Workspace workspace) { this.workspace = workspace; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public User getAssignedTo() { return assignedTo; }
    public void setAssignedTo(User assignedTo) { this.assignedTo = assignedTo; }

    public User getAssignedBy() { return assignedBy; }
    public void setAssignedBy(User assignedBy) { this.assignedBy = assignedBy; }

    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getAssignedAt() { return assignedAt; }
    public void setAssignedAt(LocalDateTime assignedAt) { this.assignedAt = assignedAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    // Builder
    public static TaskBuilder builder() {
        return new TaskBuilder();
    }

    public static class TaskBuilder {
        private Long id;
        private Workspace workspace;
        private String title;
        private String description;
        private User assignedTo;
        private User assignedBy;
        private LocalDate dueDate;
        private String priority;
        private String status;
        private LocalDateTime assignedAt;
        private LocalDateTime createdAt;

        TaskBuilder() {}

        public TaskBuilder id(Long id) { this.id = id; return this; }
        public TaskBuilder workspace(Workspace workspace) { this.workspace = workspace; return this; }
        public TaskBuilder title(String title) { this.title = title; return this; }
        public TaskBuilder description(String description) { this.description = description; return this; }
        public TaskBuilder assignedTo(User assignedTo) { this.assignedTo = assignedTo; return this; }
        public TaskBuilder assignedBy(User assignedBy) { this.assignedBy = assignedBy; return this; }
        public TaskBuilder dueDate(LocalDate dueDate) { this.dueDate = dueDate; return this; }
        public TaskBuilder priority(String priority) { this.priority = priority; return this; }
        public TaskBuilder status(String status) { this.status = status; return this; }
        public TaskBuilder assignedAt(LocalDateTime assignedAt) { this.assignedAt = assignedAt; return this; }
        public TaskBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public Task build() {
            return new Task(id, workspace, title, description, assignedTo, assignedBy, dueDate, priority, status, assignedAt, createdAt);
        }
    }
}
