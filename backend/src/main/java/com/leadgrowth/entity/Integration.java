package com.leadgrowth.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "integrations")
public class Integration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;

    @Column(nullable = false, length = 50)
    private String platform; // Meta, Google

    @Column(name = "api_key", length = 500)
    private String apiKey;

    @Column(length = 20)
    private String status; // Connected, Disconnected

    @Column(name = "last_synced_at")
    private LocalDateTime lastSyncedAt;

    // Constructors
    public Integration() {}

    public Integration(Long id, Workspace workspace, String platform, String apiKey, String status, LocalDateTime lastSyncedAt) {
        this.id = id;
        this.workspace = workspace;
        this.platform = platform;
        this.apiKey = apiKey;
        this.status = status;
        this.lastSyncedAt = lastSyncedAt;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Workspace getWorkspace() { return workspace; }
    public void setWorkspace(Workspace workspace) { this.workspace = workspace; }

    public String getPlatform() { return platform; }
    public void setPlatform(String platform) { this.platform = platform; }

    public String getApiKey() { return apiKey; }
    public void setApiKey(String apiKey) { this.apiKey = apiKey; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getLastSyncedAt() { return lastSyncedAt; }
    public void setLastSyncedAt(LocalDateTime lastSyncedAt) { this.lastSyncedAt = lastSyncedAt; }

    // Builder
    public static IntegrationBuilder builder() {
        return new IntegrationBuilder();
    }

    public static class IntegrationBuilder {
        private Long id;
        private Workspace workspace;
        private String platform;
        private String apiKey;
        private String status;
        private LocalDateTime lastSyncedAt;

        IntegrationBuilder() {}

        public IntegrationBuilder id(Long id) { this.id = id; return this; }
        public IntegrationBuilder workspace(Workspace workspace) { this.workspace = workspace; return this; }
        public IntegrationBuilder platform(String platform) { this.platform = platform; return this; }
        public IntegrationBuilder apiKey(String apiKey) { this.apiKey = apiKey; return this; }
        public IntegrationBuilder status(String status) { this.status = status; return this; }
        public IntegrationBuilder lastSyncedAt(LocalDateTime lastSyncedAt) { this.lastSyncedAt = lastSyncedAt; return this; }

        public Integration build() {
            return new Integration(id, workspace, platform, apiKey, status, lastSyncedAt);
        }
    }
}
