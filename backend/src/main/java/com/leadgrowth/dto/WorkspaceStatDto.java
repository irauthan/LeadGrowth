package com.leadgrowth.dto;

public class WorkspaceStatDto {
    private String name;
    private int teamSize;
    private int activeCampaigns;
    private long totalLeads;
    private String industry;

    public WorkspaceStatDto() {}

    public WorkspaceStatDto(String name, int teamSize, int activeCampaigns, long totalLeads, String industry) {
        this.name = name;
        this.teamSize = teamSize;
        this.activeCampaigns = activeCampaigns;
        this.totalLeads = totalLeads;
        this.industry = industry;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public int getTeamSize() { return teamSize; }
    public void setTeamSize(int teamSize) { this.teamSize = teamSize; }

    public int getActiveCampaigns() { return activeCampaigns; }
    public void setActiveCampaigns(int activeCampaigns) { this.activeCampaigns = activeCampaigns; }

    public long getTotalLeads() { return totalLeads; }
    public void setTotalLeads(long totalLeads) { this.totalLeads = totalLeads; }

    public String getIndustry() { return industry; }
    public void setIndustry(String industry) { this.industry = industry; }

    // Builder
    public static WorkspaceStatDtoBuilder builder() {
        return new WorkspaceStatDtoBuilder();
    }

    public static class WorkspaceStatDtoBuilder {
        private String name;
        private int teamSize;
        private int activeCampaigns;
        private long totalLeads;
        private String industry;

        WorkspaceStatDtoBuilder() {}

        public WorkspaceStatDtoBuilder name(String name) { this.name = name; return this; }
        public WorkspaceStatDtoBuilder teamSize(int teamSize) { this.teamSize = teamSize; return this; }
        public WorkspaceStatDtoBuilder activeCampaigns(int activeCampaigns) { this.activeCampaigns = activeCampaigns; return this; }
        public WorkspaceStatDtoBuilder totalLeads(long totalLeads) { this.totalLeads = totalLeads; return this; }
        public WorkspaceStatDtoBuilder industry(String industry) { this.industry = industry; return this; }

        public WorkspaceStatDto build() {
            return new WorkspaceStatDto(name, teamSize, activeCampaigns, totalLeads, industry);
        }
    }
}
