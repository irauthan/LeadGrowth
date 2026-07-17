package com.leadgrowth.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "campaigns")
public class Campaign {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 50)
    private String platform;

    @Column(length = 50)
    private String status;

    @Column(precision = 12, scale = 2)
    private BigDecimal spend = BigDecimal.ZERO;

    @Column
    private Integer clicks = 0;

    @Column
    private Integer impressions = 0;

    @Column(name = "leads_count")
    private Integer leadsCount = 0;

    @Column
    private Integer conversions = 0;

    @Column(precision = 12, scale = 2)
    private BigDecimal revenue = BigDecimal.ZERO;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.spend == null) this.spend = BigDecimal.ZERO;
        if (this.clicks == null) this.clicks = 0;
        if (this.impressions == null) this.impressions = 0;
        if (this.leadsCount == null) this.leadsCount = 0;
        if (this.conversions == null) this.conversions = 0;
        if (this.revenue == null) this.revenue = BigDecimal.ZERO;
    }

    // Constructors
    public Campaign() {}

    public Campaign(Long id, Workspace workspace, String name, String platform, String status, BigDecimal spend, Integer clicks, Integer impressions, Integer leadsCount, Integer conversions, BigDecimal revenue, LocalDateTime createdAt) {
        this.id = id;
        this.workspace = workspace;
        this.name = name;
        this.platform = platform;
        this.status = status;
        this.spend = spend != null ? spend : BigDecimal.ZERO;
        this.clicks = clicks != null ? clicks : 0;
        this.impressions = impressions != null ? impressions : 0;
        this.leadsCount = leadsCount != null ? leadsCount : 0;
        this.conversions = conversions != null ? conversions : 0;
        this.revenue = revenue != null ? revenue : BigDecimal.ZERO;
        this.createdAt = createdAt;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Workspace getWorkspace() { return workspace; }
    public void setWorkspace(Workspace workspace) { this.workspace = workspace; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getPlatform() { return platform; }
    public void setPlatform(String platform) { this.platform = platform; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public BigDecimal getSpend() { return spend; }
    public void setSpend(BigDecimal spend) { this.spend = spend; }

    public Integer getClicks() { return clicks; }
    public void setClicks(Integer clicks) { this.clicks = clicks; }

    public Integer getImpressions() { return impressions; }
    public void setImpressions(Integer impressions) { this.impressions = impressions; }

    public Integer getLeadsCount() { return leadsCount; }
    public void setLeadsCount(Integer leadsCount) { this.leadsCount = leadsCount; }

    public Integer getConversions() { return conversions; }
    public void setConversions(Integer conversions) { this.conversions = conversions; }

    public BigDecimal getRevenue() { return revenue; }
    public void setRevenue(BigDecimal revenue) { this.revenue = revenue; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    // Builder
    public static CampaignBuilder builder() {
        return new CampaignBuilder();
    }

    public static class CampaignBuilder {
        private Long id;
        private Workspace workspace;
        private String name;
        private String platform;
        private String status;
        private BigDecimal spend = BigDecimal.ZERO;
        private Integer clicks = 0;
        private Integer impressions = 0;
        private Integer leadsCount = 0;
        private Integer conversions = 0;
        private BigDecimal revenue = BigDecimal.ZERO;
        private LocalDateTime createdAt;

        CampaignBuilder() {}

        public CampaignBuilder id(Long id) { this.id = id; return this; }
        public CampaignBuilder workspace(Workspace workspace) { this.workspace = workspace; return this; }
        public CampaignBuilder name(String name) { this.name = name; return this; }
        public CampaignBuilder platform(String platform) { this.platform = platform; return this; }
        public CampaignBuilder status(String status) { this.status = status; return this; }
        public CampaignBuilder spend(BigDecimal spend) { this.spend = spend; return this; }
        public CampaignBuilder clicks(Integer clicks) { this.clicks = clicks; return this; }
        public CampaignBuilder impressions(Integer impressions) { this.impressions = impressions; return this; }
        public CampaignBuilder leadsCount(Integer leadsCount) { this.leadsCount = leadsCount; return this; }
        public CampaignBuilder conversions(Integer conversions) { this.conversions = conversions; return this; }
        public CampaignBuilder revenue(BigDecimal revenue) { this.revenue = revenue; return this; }
        public CampaignBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public Campaign build() {
            return new Campaign(id, workspace, name, platform, status, spend, clicks, impressions, leadsCount, conversions, revenue, createdAt);
        }
    }
}
