package com.leadgrowth.dto;

import java.time.LocalDateTime;

public class ReportDto {
    private Long id;
    private Long workspaceId;
    private String type;
    private Long generatedById;
    private String generatedByName;
    private String status; // PENDING, APPROVED, REJECTED
    private Integer completedLeads;
    private Integer pendingLeads;
    private Integer completedCalls;
    private Integer followupsCount;
    private String remarks;
    private String problemsFaced;
    private String nextDayPlan;
    private String managerComment;
    private Long reviewedById;
    private String reviewedByName;
    private LocalDateTime reviewedAt;
    private LocalDateTime submittedAt;
    private LocalDateTime createdAt;

    public ReportDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getWorkspaceId() { return workspaceId; }
    public void setWorkspaceId(Long workspaceId) { this.workspaceId = workspaceId; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public Long getGeneratedById() { return generatedById; }
    public void setGeneratedById(Long generatedById) { this.generatedById = generatedById; }

    public String getGeneratedByName() { return generatedByName; }
    public void setGeneratedByName(String generatedByName) { this.generatedByName = generatedByName; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

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

    public String getManagerComment() { return managerComment; }
    public void setManagerComment(String managerComment) { this.managerComment = managerComment; }

    public Long getReviewedById() { return reviewedById; }
    public void setReviewedById(Long reviewedById) { this.reviewedById = reviewedById; }

    public String getReviewedByName() { return reviewedByName; }
    public void setReviewedByName(String reviewedByName) { this.reviewedByName = reviewedByName; }

    public LocalDateTime getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(LocalDateTime reviewedAt) { this.reviewedAt = reviewedAt; }

    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
