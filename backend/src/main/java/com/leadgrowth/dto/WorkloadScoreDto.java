package com.leadgrowth.dto;

public class WorkloadScoreDto {
    private Long userId;
    private String userName;
    private String userEmail;
    private Integer activeLeads;
    private Integer pendingFollowups;
    private Integer todayActiveTasks;
    private Long todayCallTimeSeconds;
    private String todayCallTimeFormatted;
    private Integer overdueTasks;
    private Double workloadScore;
    private Boolean preferredForAutoAssignment;

    public WorkloadScoreDto() {}

    public WorkloadScoreDto(Long userId, String userName, String userEmail, Integer activeLeads, Integer pendingFollowups, Integer todayActiveTasks, Long todayCallTimeSeconds, String todayCallTimeFormatted, Integer overdueTasks, Double workloadScore, Boolean preferredForAutoAssignment) {
        this.userId = userId;
        this.userName = userName;
        this.userEmail = userEmail;
        this.activeLeads = activeLeads;
        this.pendingFollowups = pendingFollowups;
        this.todayActiveTasks = todayActiveTasks;
        this.todayCallTimeSeconds = todayCallTimeSeconds;
        this.todayCallTimeFormatted = todayCallTimeFormatted;
        this.overdueTasks = overdueTasks;
        this.workloadScore = workloadScore;
        this.preferredForAutoAssignment = preferredForAutoAssignment;
    }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public Integer getActiveLeads() { return activeLeads; }
    public void setActiveLeads(Integer activeLeads) { this.activeLeads = activeLeads; }

    public Integer getPendingFollowups() { return pendingFollowups; }
    public void setPendingFollowups(Integer pendingFollowups) { this.pendingFollowups = pendingFollowups; }

    public Integer getTodayActiveTasks() { return todayActiveTasks; }
    public void setTodayActiveTasks(Integer todayActiveTasks) { this.todayActiveTasks = todayActiveTasks; }

    public Long getTodayCallTimeSeconds() { return todayCallTimeSeconds; }
    public void setTodayCallTimeSeconds(Long todayCallTimeSeconds) { this.todayCallTimeSeconds = todayCallTimeSeconds; }

    public String getTodayCallTimeFormatted() { return todayCallTimeFormatted; }
    public void setTodayCallTimeFormatted(String todayCallTimeFormatted) { this.todayCallTimeFormatted = todayCallTimeFormatted; }

    public Integer getOverdueTasks() { return overdueTasks; }
    public void setOverdueTasks(Integer overdueTasks) { this.overdueTasks = overdueTasks; }

    public Double getWorkloadScore() { return workloadScore; }
    public void setWorkloadScore(Double workloadScore) { this.workloadScore = workloadScore; }

    public Boolean getPreferredForAutoAssignment() { return preferredForAutoAssignment; }
    public void setPreferredForAutoAssignment(Boolean preferredForAutoAssignment) { this.preferredForAutoAssignment = preferredForAutoAssignment; }
}
