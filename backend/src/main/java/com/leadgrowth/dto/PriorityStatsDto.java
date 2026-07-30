package com.leadgrowth.dto;

public class PriorityStatsDto {

    private long todaysWorkCount;
    private long overdueCount;
    private long highPriorityCount;
    private long todaysFollowupsCount;
    private long negotiationsCount;
    private long newLeadsCount;
    private long completedTodayCount;

    public PriorityStatsDto() {}

    public PriorityStatsDto(long todaysWorkCount, long overdueCount, long highPriorityCount, long todaysFollowupsCount, long negotiationsCount, long newLeadsCount, long completedTodayCount) {
        this.todaysWorkCount = todaysWorkCount;
        this.overdueCount = overdueCount;
        this.highPriorityCount = highPriorityCount;
        this.todaysFollowupsCount = todaysFollowupsCount;
        this.negotiationsCount = negotiationsCount;
        this.newLeadsCount = newLeadsCount;
        this.completedTodayCount = completedTodayCount;
    }

    public long getTodaysWorkCount() { return todaysWorkCount; }
    public void setTodaysWorkCount(long todaysWorkCount) { this.todaysWorkCount = todaysWorkCount; }

    public long getOverdueCount() { return overdueCount; }
    public void setOverdueCount(long overdueCount) { this.overdueCount = overdueCount; }

    public long getHighPriorityCount() { return highPriorityCount; }
    public void setHighPriorityCount(long highPriorityCount) { this.highPriorityCount = highPriorityCount; }

    public long getTodaysFollowupsCount() { return todaysFollowupsCount; }
    public void setTodaysFollowupsCount(long todaysFollowupsCount) { this.todaysFollowupsCount = todaysFollowupsCount; }

    public long getNegotiationsCount() { return negotiationsCount; }
    public void setNegotiationsCount(long negotiationsCount) { this.negotiationsCount = negotiationsCount; }

    public long getNewLeadsCount() { return newLeadsCount; }
    public void setNewLeadsCount(long newLeadsCount) { this.newLeadsCount = newLeadsCount; }

    public long getCompletedTodayCount() { return completedTodayCount; }
    public void setCompletedTodayCount(long completedTodayCount) { this.completedTodayCount = completedTodayCount; }
}
