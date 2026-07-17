package com.leadgrowth.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reports")
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;

    @Column(nullable = false, length = 20)
    private String type; // Daily, Weekly, Monthly

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "generated_by_id")
    private User generatedBy;

    @Column(name = "file_path", length = 255)
    private String filePath;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    // Constructors
    public Report() {}

    public Report(Long id, Workspace workspace, String type, User generatedBy, String filePath, LocalDateTime createdAt) {
        this.id = id;
        this.workspace = workspace;
        this.type = type;
        this.generatedBy = generatedBy;
        this.filePath = filePath;
        this.createdAt = createdAt;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Workspace getWorkspace() { return workspace; }
    public void setWorkspace(Workspace workspace) { this.workspace = workspace; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public User getGeneratedBy() { return generatedBy; }
    public void setGeneratedBy(User generatedBy) { this.generatedBy = generatedBy; }

    public String getFilePath() { return filePath; }
    public void setFilePath(String filePath) { this.filePath = filePath; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    // Builder
    public static ReportBuilder builder() {
        return new ReportBuilder();
    }

    public static class ReportBuilder {
        private Long id;
        private Workspace workspace;
        private String type;
        private User generatedBy;
        private String filePath;
        private LocalDateTime createdAt;

        ReportBuilder() {}

        public ReportBuilder id(Long id) { this.id = id; return this; }
        public ReportBuilder workspace(Workspace workspace) { this.workspace = workspace; return this; }
        public ReportBuilder type(String type) { this.type = type; return this; }
        public ReportBuilder generatedBy(User generatedBy) { this.generatedBy = generatedBy; return this; }
        public ReportBuilder filePath(String filePath) { this.filePath = filePath; return this; }
        public ReportBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public Report build() {
            return new Report(id, workspace, type, generatedBy, filePath, createdAt);
        }
    }
}
