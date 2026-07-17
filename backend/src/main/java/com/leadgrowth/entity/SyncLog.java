package com.leadgrowth.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "sync_logs")
public class SyncLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;

    @Column(length = 50)
    private String platform;

    @Column(length = 20)
    private String status; // Success, Failed

    @Column(columnDefinition = "TEXT")
    private String details;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    // Constructors
    public SyncLog() {}

    public SyncLog(Long id, Workspace workspace, String platform, String status, String details, LocalDateTime createdAt) {
        this.id = id;
        this.workspace = workspace;
        this.platform = platform;
        this.status = status;
        this.details = details;
        this.createdAt = createdAt;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Workspace getWorkspace() { return workspace; }
    public void setWorkspace(Workspace workspace) { this.workspace = workspace; }

    public String getPlatform() { return platform; }
    public void setPlatform(String platform) { this.platform = platform; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    // Builder
    public static SyncLogBuilder builder() {
        return new SyncLogBuilder();
    }

    public static class SyncLogBuilder {
        private Long id;
        private Workspace workspace;
        private String platform;
        private String status;
        private String details;
        private LocalDateTime createdAt;

        SyncLogBuilder() {}

        public SyncLogBuilder id(Long id) { this.id = id; return this; }
        public SyncLogBuilder workspace(Workspace workspace) { this.workspace = workspace; return this; }
        public SyncLogBuilder platform(String platform) { this.platform = platform; return this; }
        public SyncLogBuilder status(String status) { this.status = status; return this; }
        public SyncLogBuilder details(String details) { this.details = details; return this; }
        public SyncLogBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public SyncLog build() {
            return new SyncLog(id, workspace, platform, status, details, createdAt);
        }
    }
}
