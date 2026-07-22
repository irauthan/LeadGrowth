package com.leadgrowth.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "assignment_logs")
public class AssignmentLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;

    @Column(name = "entity_type", nullable = false, length = 20)
    private String entityType; // TASK or LEAD

    @Column(name = "entity_id", nullable = false)
    private Long entityId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to_id")
    private User assignedTo;

    @Column(name = "algorithm_details", columnDefinition = "TEXT")
    private String algorithmDetails;

    @Column(name = "assigned_at", nullable = false)
    private LocalDateTime assignedAt;

    public AssignmentLog() {}

    public AssignmentLog(Workspace workspace, String entityType, Long entityId, User assignedTo, String algorithmDetails) {
        this.workspace = workspace;
        this.entityType = entityType;
        this.entityId = entityId;
        this.assignedTo = assignedTo;
        this.algorithmDetails = algorithmDetails;
        this.assignedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Workspace getWorkspace() { return workspace; }
    public void setWorkspace(Workspace workspace) { this.workspace = workspace; }

    public String getEntityType() { return entityType; }
    public void setEntityType(String entityType) { this.entityType = entityType; }

    public Long getEntityId() { return entityId; }
    public void setEntityId(Long entityId) { this.entityId = entityId; }

    public User getAssignedTo() { return assignedTo; }
    public void setAssignedTo(User assignedTo) { this.assignedTo = assignedTo; }

    public String getAlgorithmDetails() { return algorithmDetails; }
    public void setAlgorithmDetails(String algorithmDetails) { this.algorithmDetails = algorithmDetails; }

    public LocalDateTime getAssignedAt() { return assignedAt; }
    public void setAssignedAt(LocalDateTime assignedAt) { this.assignedAt = assignedAt; }
}
