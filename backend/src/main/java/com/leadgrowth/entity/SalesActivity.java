package com.leadgrowth.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "sales_activities")
public class SalesActivity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lead_id", nullable = false)
    private Lead lead;

    @Column(name = "activity_key", nullable = false, length = 50)
    private String activityKey; // FIRST_CALL, REQUIREMENT_COLLECTION, DEMO_SCHEDULED, PROPOSAL_SENT, NEGOTIATION, CLOSING, PAYMENT_FOLLOWUP

    @Column(nullable = false, length = 100)
    private String title;

    @Column(nullable = false, length = 20)
    private String status; // PENDING, IN_PROGRESS, COMPLETED

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "completed_by_id")
    private User completedBy;

    @Column(name = "completion_remarks", columnDefinition = "TEXT")
    private String completionRemarks;

    @Column(columnDefinition = "TEXT")
    private String remarks;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "salesActivity", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("activityNumber ASC")
    private List<SalesActivityLog> logs = new ArrayList<>();

    public SalesActivity() {}

    public SalesActivity(Lead lead, String activityKey, String title, String status) {
        this.lead = lead;
        this.activityKey = activityKey;
        this.title = title;
        this.status = status != null ? status : "PENDING";
        this.createdAt = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null) {
            status = "PENDING";
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Lead getLead() { return lead; }
    public void setLead(Lead lead) { this.lead = lead; }

    public String getActivityKey() { return activityKey; }
    public void setActivityKey(String activityKey) { this.activityKey = activityKey; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }

    public User getCompletedBy() { return completedBy; }
    public void setCompletedBy(User completedBy) { this.completedBy = completedBy; }

    public String getCompletionRemarks() { return completionRemarks; }
    public void setCompletionRemarks(String completionRemarks) { this.completionRemarks = completionRemarks; }

    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public List<SalesActivityLog> getLogs() { return logs; }
    public void setLogs(List<SalesActivityLog> logs) { this.logs = logs; }
}
