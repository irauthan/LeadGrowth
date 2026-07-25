package com.leadgrowth.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "workspaces")
public class Workspace {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "company_name", length = 100)
    private String companyName;

    @Column(length = 50)
    private String industry;

    @Column(name = "team_size")
    private Integer teamSize;

    @Column(length = 100)
    private String website;

    @Column(length = 50)
    private String timezone;

    @Column(name = "invite_code", unique = true, nullable = false, length = 50)
    private String inviteCode;

    @Column(unique = true, nullable = false, length = 100)
    private String slug;

    @Column(name = "subscription_plan", nullable = false, length = 30)
    private String subscriptionPlan = "PROFESSIONAL"; // FREE, PROFESSIONAL, ENTERPRISE

    @Column(name = "max_users")
    private Integer maxUsers = 25;

    @Column(name = "max_leads")
    private Integer maxLeads = 10000;

    @Column(name = "max_storage_mb")
    private Integer maxStorageMb = 5000;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.subscriptionPlan == null) this.subscriptionPlan = "PROFESSIONAL";
        if (this.maxUsers == null) this.maxUsers = 25;
        if (this.maxLeads == null) this.maxLeads = 10000;
        if (this.maxStorageMb == null) this.maxStorageMb = 5000;
    }

    // Constructors
    public Workspace() {}

    public Workspace(Long id, String name, String companyName, String industry, Integer teamSize, String website, String timezone, String inviteCode, String slug, LocalDateTime createdAt) {
        this.id = id;
        this.name = name;
        this.companyName = companyName;
        this.industry = industry;
        this.teamSize = teamSize;
        this.website = website;
        this.timezone = timezone;
        this.inviteCode = inviteCode;
        this.slug = slug;
        this.createdAt = createdAt;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }

    public String getIndustry() { return industry; }
    public void setIndustry(String industry) { this.industry = industry; }

    public Integer getTeamSize() { return teamSize; }
    public void setTeamSize(Integer teamSize) { this.teamSize = teamSize; }

    public String getWebsite() { return website; }
    public void setWebsite(String website) { this.website = website; }

    public String getTimezone() { return timezone; }
    public void setTimezone(String timezone) { this.timezone = timezone; }

    public String getInviteCode() { return inviteCode; }
    public void setInviteCode(String inviteCode) { this.inviteCode = inviteCode; }

    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }

    public String getSubscriptionPlan() { return subscriptionPlan; }
    public void setSubscriptionPlan(String subscriptionPlan) { this.subscriptionPlan = subscriptionPlan; }

    public Integer getMaxUsers() { return maxUsers; }
    public void setMaxUsers(Integer maxUsers) { this.maxUsers = maxUsers; }

    public Integer getMaxLeads() { return maxLeads; }
    public void setMaxLeads(Integer maxLeads) { this.maxLeads = maxLeads; }

    public Integer getMaxStorageMb() { return maxStorageMb; }
    public void setMaxStorageMb(Integer maxStorageMb) { this.maxStorageMb = maxStorageMb; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    // Builder
    public static WorkspaceBuilder builder() {
        return new WorkspaceBuilder();
    }

    public static class WorkspaceBuilder {
        private Long id;
        private String name;
        private String companyName;
        private String industry;
        private Integer teamSize;
        private String website;
        private String timezone;
        private String inviteCode;
        private String slug;
        private LocalDateTime createdAt;

        WorkspaceBuilder() {}

        public WorkspaceBuilder id(Long id) { this.id = id; return this; }
        public WorkspaceBuilder name(String name) { this.name = name; return this; }
        public WorkspaceBuilder companyName(String companyName) { this.companyName = companyName; return this; }
        public WorkspaceBuilder industry(String industry) { this.industry = industry; return this; }
        public WorkspaceBuilder teamSize(Integer teamSize) { this.teamSize = teamSize; return this; }
        public WorkspaceBuilder website(String website) { this.website = website; return this; }
        public WorkspaceBuilder timezone(String timezone) { this.timezone = timezone; return this; }
        public WorkspaceBuilder inviteCode(String inviteCode) { this.inviteCode = inviteCode; return this; }
        public WorkspaceBuilder slug(String slug) { this.slug = slug; return this; }
        public WorkspaceBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public Workspace build() {
            return new Workspace(id, name, companyName, industry, teamSize, website, timezone, inviteCode, slug, createdAt);
        }
    }
}
