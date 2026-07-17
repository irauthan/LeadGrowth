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

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
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

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

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
