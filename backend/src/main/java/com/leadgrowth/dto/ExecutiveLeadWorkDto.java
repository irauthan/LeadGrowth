package com.leadgrowth.dto;

import java.util.List;
import java.util.Map;

public class ExecutiveLeadWorkDto {
    private Long leadId;
    private String leadName;
    private String leadPhone;
    private String leadEmail;
    private String leadStatus;
    private String priority;
    private String assignedToName;
    private Long assignedToId;
    private String lastActivityAt;
    private long totalActivitiesCount;

    private List<SalesActivityLogDto> activityLogs;
    private List<Map<String, Object>> followups;
    private List<LeadHistoryDto> timelineHistory;

    public ExecutiveLeadWorkDto() {}

    public ExecutiveLeadWorkDto(Long leadId, String leadName, String leadPhone, String leadEmail, String leadStatus, String priority, String assignedToName, Long assignedToId, String lastActivityAt, long totalActivitiesCount, List<SalesActivityLogDto> activityLogs, List<Map<String, Object>> followups, List<LeadHistoryDto> timelineHistory) {
        this.leadId = leadId;
        this.leadName = leadName;
        this.leadPhone = leadPhone;
        this.leadEmail = leadEmail;
        this.leadStatus = leadStatus;
        this.priority = priority;
        this.assignedToName = assignedToName;
        this.assignedToId = assignedToId;
        this.lastActivityAt = lastActivityAt;
        this.totalActivitiesCount = totalActivitiesCount;
        this.activityLogs = activityLogs;
        this.followups = followups;
        this.timelineHistory = timelineHistory;
    }

    public Long getLeadId() { return leadId; }
    public void setLeadId(Long leadId) { this.leadId = leadId; }

    public String getLeadName() { return leadName; }
    public void setLeadName(String leadName) { this.leadName = leadName; }

    public String getLeadPhone() { return leadPhone; }
    public void setLeadPhone(String leadPhone) { this.leadPhone = leadPhone; }

    public String getLeadEmail() { return leadEmail; }
    public void setLeadEmail(String leadEmail) { this.leadEmail = leadEmail; }

    public String getLeadStatus() { return leadStatus; }
    public void setLeadStatus(String leadStatus) { this.leadStatus = leadStatus; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public String getAssignedToName() { return assignedToName; }
    public void setAssignedToName(String assignedToName) { this.assignedToName = assignedToName; }

    public Long getAssignedToId() { return assignedToId; }
    public void setAssignedToId(Long assignedToId) { this.assignedToId = assignedToId; }

    public String getLastActivityAt() { return lastActivityAt; }
    public void setLastActivityAt(String lastActivityAt) { this.lastActivityAt = lastActivityAt; }

    public long getTotalActivitiesCount() { return totalActivitiesCount; }
    public void setTotalActivitiesCount(long totalActivitiesCount) { this.totalActivitiesCount = totalActivitiesCount; }

    public List<SalesActivityLogDto> getActivityLogs() { return activityLogs; }
    public void setActivityLogs(List<SalesActivityLogDto> activityLogs) { this.activityLogs = activityLogs; }

    public List<Map<String, Object>> getFollowups() { return followups; }
    public void setFollowups(List<Map<String, Object>> followups) { this.followups = followups; }

    public List<LeadHistoryDto> getTimelineHistory() { return timelineHistory; }
    public void setTimelineHistory(List<LeadHistoryDto> timelineHistory) { this.timelineHistory = timelineHistory; }
}
