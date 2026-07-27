package com.leadgrowth.dto;

import jakarta.validation.constraints.NotNull;

public class DailyReportSubmitRequest {
    private Integer completedLeads;
    private Integer pendingLeads;
    private Integer completedCalls;
    private Integer followupsCount;

    private String remarks;
    private String problemsFaced;
    private String nextDayPlan;

    public DailyReportSubmitRequest() {}

    public Integer getCompletedLeads() { return completedLeads; }
    public void setCompletedLeads(Integer completedLeads) { this.completedLeads = completedLeads; }

    public Integer getPendingLeads() { return pendingLeads; }
    public void setPendingLeads(Integer pendingLeads) { this.pendingLeads = pendingLeads; }

    public Integer getCompletedCalls() { return completedCalls; }
    public void setCompletedCalls(Integer completedCalls) { this.completedCalls = completedCalls; }

    public Integer getFollowupsCount() { return followupsCount; }
    public void setFollowupsCount(Integer followupsCount) { this.followupsCount = followupsCount; }

    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }

    public String getProblemsFaced() { return problemsFaced; }
    public void setProblemsFaced(String problemsFaced) { this.problemsFaced = problemsFaced; }

    public String getNextDayPlan() { return nextDayPlan; }
    public void setNextDayPlan(String nextDayPlan) { this.nextDayPlan = nextDayPlan; }
}
