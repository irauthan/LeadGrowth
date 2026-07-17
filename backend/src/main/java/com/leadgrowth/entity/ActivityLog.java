package com.leadgrowth.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "activity_logs")
public class ActivityLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false, length = 100)
    private String action;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    // Constructors
    public ActivityLog() {}

    public ActivityLog(Long id, Workspace workspace, User user, String action, String description, LocalDateTime createdAt) {
        this.id = id;
        this.workspace = workspace;
        this.user = user;
        this.action = action;
        this.description = description;
        this.createdAt = createdAt;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Workspace getWorkspace() { return workspace; }
    public void setWorkspace(Workspace workspace) { this.workspace = workspace; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    // Builder
    public static ActivityLogBuilder builder() {
        return new ActivityLogBuilder();
    }

    public static class ActivityLogBuilder {
        private Long id;
        private Workspace workspace;
        private User user;
        private String action;
        private String description;
        private LocalDateTime createdAt;

        ActivityLogBuilder() {}

        public ActivityLogBuilder id(Long id) { this.id = id; return this; }
        public ActivityLogBuilder workspace(Workspace workspace) { this.workspace = workspace; return this; }
        public ActivityLogBuilder user(User user) { this.user = user; return this; }
        public ActivityLogBuilder action(String action) { this.action = action; return this; }
        public ActivityLogBuilder description(String description) { this.description = description; return this; }
        public ActivityLogBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public ActivityLog build() {
            return new ActivityLog(id, workspace, user, action, description, createdAt);
        }
    }
}
