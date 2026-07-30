package com.leadgrowth.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "followup_reminders")
public class FollowupReminder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lead_id", nullable = false)
    private Lead lead;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to_id", nullable = false)
    private User assignedTo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;

    @Column(nullable = false)
    private LocalDateTime scheduledAt;

    @Column(nullable = false)
    private String status; // UPCOMING, PENDING, COMPLETED, MISSED

    private String type; // CALL, EMAIL, MEETING, DEMO

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(columnDefinition = "TEXT")
    private String remarks;

    private String outcome;

    private LocalDateTime nextFollowupDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id")
    private User createdBy;

    private LocalDateTime completedAt;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public FollowupReminder() {}

    public FollowupReminder(Lead lead, User assignedTo, Workspace workspace, LocalDateTime scheduledAt, String type, String notes) {
        this.lead = lead;
        this.assignedTo = assignedTo;
        this.workspace = workspace;
        this.scheduledAt = scheduledAt;
        this.status = "UPCOMING";
        this.type = type != null ? type : "CALL";
        this.notes = notes;
        this.remarks = notes;
        this.createdAt = LocalDateTime.now();
    }

    public FollowupReminder(Lead lead, User assignedTo, Workspace workspace, LocalDateTime scheduledAt, String type, String notes, String outcome, LocalDateTime nextFollowupDate, User createdBy) {
        this.lead = lead;
        this.assignedTo = assignedTo;
        this.workspace = workspace;
        this.scheduledAt = scheduledAt;
        this.status = "UPCOMING";
        this.type = type != null ? type : "CALL";
        this.notes = notes;
        this.remarks = notes;
        this.outcome = outcome;
        this.nextFollowupDate = nextFollowupDate;
        this.createdBy = createdBy;
        this.createdAt = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null) {
            status = "UPCOMING";
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Lead getLead() { return lead; }
    public void setLead(Lead lead) { this.lead = lead; }

    public User getAssignedTo() { return assignedTo; }
    public void setAssignedTo(User assignedTo) { this.assignedTo = assignedTo; }

    public Workspace getWorkspace() { return workspace; }
    public void setWorkspace(Workspace workspace) { this.workspace = workspace; }

    public LocalDateTime getScheduledAt() { return scheduledAt; }
    public void setScheduledAt(LocalDateTime scheduledAt) { this.scheduledAt = scheduledAt; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }

    public String getOutcome() { return outcome; }
    public void setOutcome(String outcome) { this.outcome = outcome; }

    public LocalDateTime getNextFollowupDate() { return nextFollowupDate; }
    public void setNextFollowupDate(LocalDateTime nextFollowupDate) { this.nextFollowupDate = nextFollowupDate; }

    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
