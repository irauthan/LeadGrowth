package com.leadgrowth.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "ad_metrics")
public class AdMetrics {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "campaign_id")
    private Campaign campaign;

    @Column(length = 50)
    private String platform;

    @Column(precision = 12, scale = 2)
    private BigDecimal spend;

    @Column
    private Integer clicks;

    @Column
    private Integer impressions;

    @Column
    private Integer conversions;

    @Column(nullable = false)
    private LocalDate date;

    // Constructors
    public AdMetrics() {}

    public AdMetrics(Long id, Workspace workspace, Campaign campaign, String platform, BigDecimal spend, Integer clicks, Integer impressions, Integer conversions, LocalDate date) {
        this.id = id;
        this.workspace = workspace;
        this.campaign = campaign;
        this.platform = platform;
        this.spend = spend;
        this.clicks = clicks;
        this.impressions = impressions;
        this.conversions = conversions;
        this.date = date;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Workspace getWorkspace() { return workspace; }
    public void setWorkspace(Workspace workspace) { this.workspace = workspace; }

    public Campaign getCampaign() { return campaign; }
    public void setCampaign(Campaign campaign) { this.campaign = campaign; }

    public String getPlatform() { return platform; }
    public void setPlatform(String platform) { this.platform = platform; }

    public BigDecimal getSpend() { return spend; }
    public void setSpend(BigDecimal spend) { this.spend = spend; }

    public Integer getClicks() { return clicks; }
    public void setClicks(Integer clicks) { this.clicks = clicks; }

    public Integer getImpressions() { return impressions; }
    public void setImpressions(Integer impressions) { this.impressions = impressions; }

    public Integer getConversions() { return conversions; }
    public void setConversions(Integer conversions) { this.conversions = conversions; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    // Builder
    public static AdMetricsBuilder builder() {
        return new AdMetricsBuilder();
    }

    public static class AdMetricsBuilder {
        private Long id;
        private Workspace workspace;
        private Campaign campaign;
        private String platform;
        private BigDecimal spend;
        private Integer clicks;
        private Integer impressions;
        private Integer conversions;
        private LocalDate date;

        AdMetricsBuilder() {}

        public AdMetricsBuilder id(Long id) { this.id = id; return this; }
        public AdMetricsBuilder workspace(Workspace workspace) { this.workspace = workspace; return this; }
        public AdMetricsBuilder campaign(Campaign campaign) { this.campaign = campaign; return this; }
        public AdMetricsBuilder platform(String platform) { this.platform = platform; return this; }
        public AdMetricsBuilder spend(BigDecimal spend) { this.spend = spend; return this; }
        public AdMetricsBuilder clicks(Integer clicks) { this.clicks = clicks; return this; }
        public AdMetricsBuilder impressions(Integer impressions) { this.impressions = impressions; return this; }
        public AdMetricsBuilder conversions(Integer conversions) { this.conversions = conversions; return this; }
        public AdMetricsBuilder date(LocalDate date) { this.date = date; return this; }

        public AdMetrics build() {
            return new AdMetrics(id, workspace, campaign, platform, spend, clicks, impressions, conversions, date);
        }
    }
}
