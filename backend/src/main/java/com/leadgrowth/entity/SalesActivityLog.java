package com.leadgrowth.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "sales_activity_logs")
public class SalesActivityLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sales_activity_id", nullable = false)
    private SalesActivity salesActivity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lead_id", nullable = false)
    private Lead lead;

    @Column(name = "activity_number", nullable = false)
    private Integer activityNumber;

    @Column(name = "communication_type", nullable = false, length = 50)
    private String communicationType; // PHONE_CALL, WHATSAPP, EMAIL, GOOGLE_MEET, ZOOM, OFFICE_VISIT, VIDEO_CALL, OTHER

    @Column(nullable = false, length = 50)
    private String outcome; // BUSY, NOT_ANSWERED, REJECTED_CALL, WRONG_NUMBER, INTERESTED, NOT_INTERESTED, CALL_BACK_LATER, MEETING_SCHEDULED, DEMO_SCHEDULED, PROPOSAL_REQUESTED, NEGOTIATION_STARTED, CONVERTED, LOST, CUSTOM_OUTCOME

    @Column(columnDefinition = "TEXT")
    private String remarks;

    @Column(length = 30)
    private String duration; // e.g. "10 mins"

    @Column(nullable = false, length = 30)
    private String status; // ATTEMPTED, IN_PROGRESS, WAITING, SCHEDULED, SUCCESSFUL, COMPLETED, CANCELLED

    @Column(name = "next_followup_date")
    private LocalDateTime nextFollowupDate;

    @Column(columnDefinition = "TEXT")
    private String attachments;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "logged_by_id", nullable = false)
    private User loggedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public SalesActivityLog() {}

    public SalesActivityLog(
            SalesActivity salesActivity,
            Lead lead,
            Integer activityNumber,
            String communicationType,
            String outcome,
            String remarks,
            String duration,
            String status,
            LocalDateTime nextFollowupDate,
            String attachments,
            User loggedBy
    ) {
        this.salesActivity = salesActivity;
        this.lead = lead;
        this.activityNumber = activityNumber != null ? activityNumber : 1;
        this.communicationType = communicationType != null ? communicationType : "PHONE_CALL";
        this.outcome = outcome != null ? outcome : "BUSY";
        this.remarks = remarks;
        this.duration = duration;
        this.status = status != null ? status : "ATTEMPTED";
        this.nextFollowupDate = nextFollowupDate;
        this.attachments = attachments;
        this.loggedBy = loggedBy;
        this.createdAt = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null) {
            status = "ATTEMPTED";
        }
        if (communicationType == null) {
            communicationType = "PHONE_CALL";
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public SalesActivity getSalesActivity() { return salesActivity; }
    public void setSalesActivity(SalesActivity salesActivity) { this.salesActivity = salesActivity; }

    public Lead getLead() { return lead; }
    public void setLead(Lead lead) { this.lead = lead; }

    public Integer getActivityNumber() { return activityNumber; }
    public void setActivityNumber(Integer activityNumber) { this.activityNumber = activityNumber; }

    public String getCommunicationType() { return communicationType; }
    public void setCommunicationType(String communicationType) { this.communicationType = communicationType; }

    public String getOutcome() { return outcome; }
    public void setOutcome(String outcome) { this.outcome = outcome; }

    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }

    public String getDuration() { return duration; }
    public void setDuration(String duration) { this.duration = duration; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getNextFollowupDate() { return nextFollowupDate; }
    public void setNextFollowupDate(LocalDateTime nextFollowupDate) { this.nextFollowupDate = nextFollowupDate; }

    public String getAttachments() { return attachments; }
    public void setAttachments(String attachments) { this.attachments = attachments; }

    public User getLoggedBy() { return loggedBy; }
    public void setLoggedBy(User loggedBy) { this.loggedBy = loggedBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
