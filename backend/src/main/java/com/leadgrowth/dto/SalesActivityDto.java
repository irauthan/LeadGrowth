package com.leadgrowth.dto;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class SalesActivityDto {
    private Long id;
    private Long leadId;
    private String activityKey;
    private String title;
    private String status; // PENDING, IN_PROGRESS, COMPLETED
    private LocalDateTime completedAt;
    private Long completedById;
    private String completedByName;
    private String completionRemarks;
    private String remarks;
    private LocalDateTime createdAt;
    private List<SalesActivityLogDto> logs = new ArrayList<>();
    private int totalActivitiesCount;

    public SalesActivityDto() {}

    public SalesActivityDto(
            Long id,
            Long leadId,
            String activityKey,
            String title,
            String status,
            LocalDateTime completedAt,
            Long completedById,
            String completedByName,
            String completionRemarks,
            String remarks,
            LocalDateTime createdAt,
            List<SalesActivityLogDto> logs
    ) {
        this.id = id;
        this.leadId = leadId;
        this.activityKey = activityKey;
        this.title = title;
        this.status = status;
        this.completedAt = completedAt;
        this.completedById = completedById;
        this.completedByName = completedByName;
        this.completionRemarks = completionRemarks;
        this.remarks = remarks;
        this.createdAt = createdAt;
        this.logs = logs != null ? logs : new ArrayList<>();
        this.totalActivitiesCount = this.logs.size();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getLeadId() { return leadId; }
    public void setLeadId(Long leadId) { this.leadId = leadId; }

    public String getActivityKey() { return activityKey; }
    public void setActivityKey(String activityKey) { this.activityKey = activityKey; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }

    public Long getCompletedById() { return completedById; }
    public void setCompletedById(Long completedById) { this.completedById = completedById; }

    public String getCompletedByName() { return completedByName; }
    public void setCompletedByName(String completedByName) { this.completedByName = completedByName; }

    public String getCompletionRemarks() { return completionRemarks; }
    public void setCompletionRemarks(String completionRemarks) { this.completionRemarks = completionRemarks; }

    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public List<SalesActivityLogDto> getLogs() { return logs; }
    public void setLogs(List<SalesActivityLogDto> logs) {
        this.logs = logs;
        this.totalActivitiesCount = logs != null ? logs.size() : 0;
    }

    public int getTotalActivitiesCount() { return totalActivitiesCount; }
    public void setTotalActivitiesCount(int totalActivitiesCount) { this.totalActivitiesCount = totalActivitiesCount; }
}
