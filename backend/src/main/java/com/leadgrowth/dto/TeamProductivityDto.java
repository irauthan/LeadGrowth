package com.leadgrowth.dto;

public class TeamProductivityDto {
    private Long userId;
    private String fullName;
    private int completedTasks;
    private int completedLeads;
    private double conversionRate;
    private double averageResponseTime;
    private double score;
    private String performanceCategory;

    public TeamProductivityDto() {}

    public TeamProductivityDto(Long userId, String fullName, int completedTasks, int completedLeads, double conversionRate, double averageResponseTime, double score, String performanceCategory) {
        this.userId = userId;
        this.fullName = fullName;
        this.completedTasks = completedTasks;
        this.completedLeads = completedLeads;
        this.conversionRate = conversionRate;
        this.averageResponseTime = averageResponseTime;
        this.score = score;
        this.performanceCategory = performanceCategory;
    }

    // Getters and Setters
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public int getCompletedTasks() { return completedTasks; }
    public void setCompletedTasks(int completedTasks) { this.completedTasks = completedTasks; }

    public int getCompletedLeads() { return completedLeads; }
    public void setCompletedLeads(int completedLeads) { this.completedLeads = completedLeads; }

    public double getConversionRate() { return conversionRate; }
    public void setConversionRate(double conversionRate) { this.conversionRate = conversionRate; }

    public double getAverageResponseTime() { return averageResponseTime; }
    public void setAverageResponseTime(double averageResponseTime) { this.averageResponseTime = averageResponseTime; }

    public double getScore() { return score; }
    public void setScore(double score) { this.score = score; }

    public String getPerformanceCategory() { return performanceCategory; }
    public void setPerformanceCategory(String performanceCategory) { this.performanceCategory = performanceCategory; }
}
