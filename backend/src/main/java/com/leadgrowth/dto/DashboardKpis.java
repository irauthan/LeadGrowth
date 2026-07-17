package com.leadgrowth.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public class DashboardKpis {
    private long totalLeads;
    private long totalClicks;
    private long totalImpressions;
    private long totalConversions;
    private BigDecimal totalSpend;
    private BigDecimal totalRevenue;
    private double roas;
    private double ctr;
    private double cpc;

    private List<LeadDto> recentLeads;
    private List<PlatformShare> platformLeadsShare;
    private List<PlatformShare> platformRevenueShare;
    private List<TrendDataPoint> trends;
    private Map<String, Long> funnel;
    private List<TeamActivityDto> teamActivities;
    private List<WorkspaceStatDto> workspaceStats;

    public DashboardKpis() {}

    public DashboardKpis(long totalLeads, long totalClicks, long totalImpressions, long totalConversions, BigDecimal totalSpend, BigDecimal totalRevenue, double roas, double ctr, double cpc, List<LeadDto> recentLeads, List<PlatformShare> platformLeadsShare, List<PlatformShare> platformRevenueShare, List<TrendDataPoint> trends, Map<String, Long> funnel, List<TeamActivityDto> teamActivities, List<WorkspaceStatDto> workspaceStats) {
        this.totalLeads = totalLeads;
        this.totalClicks = totalClicks;
        this.totalImpressions = totalImpressions;
        this.totalConversions = totalConversions;
        this.totalSpend = totalSpend;
        this.totalRevenue = totalRevenue;
        this.roas = roas;
        this.ctr = ctr;
        this.cpc = cpc;
        this.recentLeads = recentLeads;
        this.platformLeadsShare = platformLeadsShare;
        this.platformRevenueShare = platformRevenueShare;
        this.trends = trends;
        this.funnel = funnel;
        this.teamActivities = teamActivities;
        this.workspaceStats = workspaceStats;
    }

    public long getTotalLeads() { return totalLeads; }
    public void setTotalLeads(long totalLeads) { this.totalLeads = totalLeads; }

    public long getTotalClicks() { return totalClicks; }
    public void setTotalClicks(long totalClicks) { this.totalClicks = totalClicks; }

    public long getTotalImpressions() { return totalImpressions; }
    public void setTotalImpressions(long totalImpressions) { this.totalImpressions = totalImpressions; }

    public long getTotalConversions() { return totalConversions; }
    public void setTotalConversions(long totalConversions) { this.totalConversions = totalConversions; }

    public BigDecimal getTotalSpend() { return totalSpend; }
    public void setTotalSpend(BigDecimal totalSpend) { this.totalSpend = totalSpend; }

    public BigDecimal getTotalRevenue() { return totalRevenue; }
    public void setTotalRevenue(BigDecimal totalRevenue) { this.totalRevenue = totalRevenue; }

    public double getRoas() { return roas; }
    public void setRoas(double roas) { this.roas = roas; }

    public double getCtr() { return ctr; }
    public void setCtr(double ctr) { this.ctr = ctr; }

    public double getCpc() { return cpc; }
    public void setCpc(double cpc) { this.cpc = cpc; }

    public List<LeadDto> getRecentLeads() { return recentLeads; }
    public void setRecentLeads(List<LeadDto> recentLeads) { this.recentLeads = recentLeads; }

    public List<PlatformShare> getPlatformLeadsShare() { return platformLeadsShare; }
    public void setPlatformLeadsShare(List<PlatformShare> platformLeadsShare) { this.platformLeadsShare = platformLeadsShare; }

    public List<PlatformShare> getPlatformRevenueShare() { return platformRevenueShare; }
    public void setPlatformRevenueShare(List<PlatformShare> platformRevenueShare) { this.platformRevenueShare = platformRevenueShare; }

    public List<TrendDataPoint> getTrends() { return trends; }
    public void setTrends(List<TrendDataPoint> trends) { this.trends = trends; }

    public Map<String, Long> getFunnel() { return funnel; }
    public void setFunnel(Map<String, Long> funnel) { this.funnel = funnel; }

    public List<TeamActivityDto> getTeamActivities() { return teamActivities; }
    public void setTeamActivities(List<TeamActivityDto> teamActivities) { this.teamActivities = teamActivities; }

    public List<WorkspaceStatDto> getWorkspaceStats() { return workspaceStats; }
    public void setWorkspaceStats(List<WorkspaceStatDto> workspaceStats) { this.workspaceStats = workspaceStats; }

    // Builder
    public static DashboardKpisBuilder builder() {
        return new DashboardKpisBuilder();
    }

    public static class DashboardKpisBuilder {
        private long totalLeads;
        private long totalClicks;
        private long totalImpressions;
        private long totalConversions;
        private BigDecimal totalSpend;
        private BigDecimal totalRevenue;
        private double roas;
        private double ctr;
        private double cpc;
        private List<LeadDto> recentLeads;
        private List<PlatformShare> platformLeadsShare;
        private List<PlatformShare> platformRevenueShare;
        private List<TrendDataPoint> trends;
        private Map<String, Long> funnel;
        private List<TeamActivityDto> teamActivities;
        private List<WorkspaceStatDto> workspaceStats;

        DashboardKpisBuilder() {}

        public DashboardKpisBuilder totalLeads(long totalLeads) { this.totalLeads = totalLeads; return this; }
        public DashboardKpisBuilder totalClicks(long totalClicks) { this.totalClicks = totalClicks; return this; }
        public DashboardKpisBuilder totalImpressions(long totalImpressions) { this.totalImpressions = totalImpressions; return this; }
        public DashboardKpisBuilder totalConversions(long totalConversions) { this.totalConversions = totalConversions; return this; }
        public DashboardKpisBuilder totalSpend(BigDecimal totalSpend) { this.totalSpend = totalSpend; return this; }
        public DashboardKpisBuilder totalRevenue(BigDecimal totalRevenue) { this.totalRevenue = totalRevenue; return this; }
        public DashboardKpisBuilder roas(double roas) { this.roas = roas; return this; }
        public DashboardKpisBuilder ctr(double ctr) { this.ctr = ctr; return this; }
        public DashboardKpisBuilder cpc(double cpc) { this.cpc = cpc; return this; }
        public DashboardKpisBuilder recentLeads(List<LeadDto> recentLeads) { this.recentLeads = recentLeads; return this; }
        public DashboardKpisBuilder platformLeadsShare(List<PlatformShare> platformLeadsShare) { this.platformLeadsShare = platformLeadsShare; return this; }
        public DashboardKpisBuilder platformRevenueShare(List<PlatformShare> platformRevenueShare) { this.platformRevenueShare = platformRevenueShare; return this; }
        public DashboardKpisBuilder trends(List<TrendDataPoint> trends) { this.trends = trends; return this; }
        public DashboardKpisBuilder funnel(Map<String, Long> funnel) { this.funnel = funnel; return this; }
        public DashboardKpisBuilder teamActivities(List<TeamActivityDto> teamActivities) { this.teamActivities = teamActivities; return this; }
        public DashboardKpisBuilder workspaceStats(List<WorkspaceStatDto> workspaceStats) { this.workspaceStats = workspaceStats; return this; }

        public DashboardKpis build() {
            return new DashboardKpis(totalLeads, totalClicks, totalImpressions, totalConversions, totalSpend, totalRevenue, roas, ctr, cpc, recentLeads, platformLeadsShare, platformRevenueShare, trends, funnel, teamActivities, workspaceStats);
        }
    }
}
