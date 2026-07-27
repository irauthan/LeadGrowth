package com.leadgrowth.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "leads")
public class Lead {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "campaign_id")
    private Campaign campaign;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 100)
    private String email;

    @Column(length = 20)
    private String phone;

    @Column(name = "source_platform", length = 50)
    private String sourcePlatform;

    @Column(name = "campaign_name", length = 100)
    private String campaignName;

    @Column(length = 50)
    private String status; // New, Contacted, Qualified, Converted, Rejected

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to_id")
    private User assignedTo;

    @Column(name = "quality_score")
    private Integer qualityScore;

    @Column(name = "quality_tier", length = 20)
    private String qualityTier; // HOT, WARM, COLD

    @Column(name = "conversion_probability")
    private Double conversionProbability;

    @Column(name = "queue_status", length = 30)
    private String queueStatus; // IN_QUEUE, ASSIGNED, ARCHIVED

    @Column(length = 100)
    private String company;

    @Column(length = 100)
    private String location;

    @Column(length = 20)
    private String priority; // HIGH, MEDIUM, LOW

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_by_id")
    private User assignedBy;

    @Column(name = "assigned_date")
    private LocalDateTime assignedDate;

    @Column(name = "progress_percentage")
    private Integer progressPercentage;

    @Column(name = "last_followup_date")
    private LocalDateTime lastFollowupDate;

    @Column(name = "due_date")
    private LocalDateTime dueDate;

    @Column(name = "client_notes", columnDefinition = "TEXT")
    private String clientNotes;

    @Column(name = "proposal_amount")
    private Double proposalAmount;

    @Column(name = "proposal_status", length = 30)
    private String proposalStatus;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.priority == null) {
            this.priority = "MEDIUM";
        }
        if (this.progressPercentage == null) {
            this.progressPercentage = 0;
        }
        this.createdAt = LocalDateTime.now();
        if (this.qualityScore == null) {
            this.qualityScore = (int) (Math.random() * 30) + 65; // default 65-95
        }
        if (this.qualityTier == null) {
            this.qualityTier = this.qualityScore >= 80 ? "HOT" : (this.qualityScore >= 60 ? "WARM" : "COLD");
        }
        if (this.conversionProbability == null) {
            this.conversionProbability = (double) this.qualityScore;
        }
        if (this.queueStatus == null) {
            this.queueStatus = (this.assignedTo != null) ? "ASSIGNED" : "IN_QUEUE";
        }
    }

    // Constructors
    public Lead() {}

    public Lead(Long id, Workspace workspace, Campaign campaign, String name, String email, String phone, String sourcePlatform, String campaignName, String status, User assignedTo, LocalDateTime createdAt) {
        this.id = id;
        this.workspace = workspace;
        this.campaign = campaign;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.sourcePlatform = sourcePlatform;
        this.campaignName = campaignName;
        this.status = status;
        this.assignedTo = assignedTo;
        this.createdAt = createdAt;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Workspace getWorkspace() { return workspace; }
    public void setWorkspace(Workspace workspace) { this.workspace = workspace; }

    public Campaign getCampaign() { return campaign; }
    public void setCampaign(Campaign campaign) { this.campaign = campaign; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getSourcePlatform() { return sourcePlatform; }
    public void setSourcePlatform(String sourcePlatform) { this.sourcePlatform = sourcePlatform; }

    public String getCampaignName() { return campaignName; }
    public void setCampaignName(String campaignName) { this.campaignName = campaignName; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public User getAssignedTo() { return assignedTo; }
    public void setAssignedTo(User assignedTo) { this.assignedTo = assignedTo; }
    
    @Transient
    public Long getAssignedToId() { return assignedTo != null ? assignedTo.getId() : null; }

    public Integer getQualityScore() { return qualityScore; }
    public void setQualityScore(Integer qualityScore) { this.qualityScore = qualityScore; }

    public String getQualityTier() { return qualityTier; }
    public void setQualityTier(String qualityTier) { this.qualityTier = qualityTier; }

    public Double getConversionProbability() { return conversionProbability; }
    public void setConversionProbability(Double conversionProbability) { this.conversionProbability = conversionProbability; }

    public String getQueueStatus() { return queueStatus; }
    public void setQueueStatus(String queueStatus) { this.queueStatus = queueStatus; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getCompany() { return company; }
    public void setCompany(String company) { this.company = company; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public User getAssignedBy() { return assignedBy; }
    public void setAssignedBy(User assignedBy) { this.assignedBy = assignedBy; }

    @Transient
    public Long getAssignedById() { return assignedBy != null ? assignedBy.getId() : null; }

    public LocalDateTime getAssignedDate() { return assignedDate; }
    public void setAssignedDate(LocalDateTime assignedDate) { this.assignedDate = assignedDate; }

    public Integer getProgressPercentage() { return progressPercentage; }
    public void setProgressPercentage(Integer progressPercentage) { this.progressPercentage = progressPercentage; }

    public LocalDateTime getLastFollowupDate() { return lastFollowupDate; }
    public void setLastFollowupDate(LocalDateTime lastFollowupDate) { this.lastFollowupDate = lastFollowupDate; }

    public LocalDateTime getDueDate() { return dueDate; }
    public void setDueDate(LocalDateTime dueDate) { this.dueDate = dueDate; }

    public String getClientNotes() { return clientNotes; }
    public void setClientNotes(String clientNotes) { this.clientNotes = clientNotes; }

    public Double getProposalAmount() { return proposalAmount; }
    public void setProposalAmount(Double proposalAmount) { this.proposalAmount = proposalAmount; }

    public String getProposalStatus() { return proposalStatus; }
    public void setProposalStatus(String proposalStatus) { this.proposalStatus = proposalStatus; }

    // Builder
    public static LeadBuilder builder() {
        return new LeadBuilder();
    }

    public static class LeadBuilder {
        private Long id;
        private Workspace workspace;
        private Campaign campaign;
        private String name;
        private String email;
        private String phone;
        private String sourcePlatform;
        private String campaignName;
        private String status;
        private User assignedTo;
        private LocalDateTime createdAt;

        LeadBuilder() {}

        public LeadBuilder id(Long id) { this.id = id; return this; }
        public LeadBuilder workspace(Workspace workspace) { this.workspace = workspace; return this; }
        public LeadBuilder campaign(Campaign campaign) { this.campaign = campaign; return this; }
        public LeadBuilder name(String name) { this.name = name; return this; }
        public LeadBuilder email(String email) { this.email = email; return this; }
        public LeadBuilder phone(String phone) { this.phone = phone; return this; }
        public LeadBuilder sourcePlatform(String sourcePlatform) { this.sourcePlatform = sourcePlatform; return this; }
        public LeadBuilder campaignName(String campaignName) { this.campaignName = campaignName; return this; }
        public LeadBuilder status(String status) { this.status = status; return this; }
        public LeadBuilder assignedTo(User assignedTo) { this.assignedTo = assignedTo; return this; }
        public LeadBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public Lead build() {
            return new Lead(id, workspace, campaign, name, email, phone, sourcePlatform, campaignName, status, assignedTo, createdAt);
        }
    }
}
