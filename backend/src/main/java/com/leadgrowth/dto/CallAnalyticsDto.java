package com.leadgrowth.dto;

import java.util.List;
import java.util.Map;

public class CallAnalyticsDto {
    private Long todayCallTimeSeconds;
    private String todayCallTimeFormatted;
    private Integer todayCallsCount;
    private Long avgDurationSeconds;
    private String avgDurationFormatted;
    private Long longestCallSeconds;
    private String longestCallFormatted;
    private CallSessionDto activeCallSession;

    private Long weeklyCallTimeSeconds;
    private String weeklyCallTimeFormatted;
    private Long monthlyCallTimeSeconds;
    private String monthlyCallTimeFormatted;

    private Integer totalTeamCallsToday;
    private Long totalTeamCallTimeSeconds;
    private String totalTeamCallTimeFormatted;
    private String topCallingUser;
    private String leastActiveUser;

    private List<Map<String, Object>> dailyCallDurationChart;
    private List<Map<String, Object>> userProductivityLeaderboard;

    public CallAnalyticsDto() {}

    public Long getTodayCallTimeSeconds() { return todayCallTimeSeconds; }
    public void setTodayCallTimeSeconds(Long todayCallTimeSeconds) { this.todayCallTimeSeconds = todayCallTimeSeconds; }

    public String getTodayCallTimeFormatted() { return todayCallTimeFormatted; }
    public void setTodayCallTimeFormatted(String todayCallTimeFormatted) { this.todayCallTimeFormatted = todayCallTimeFormatted; }

    public Integer getTodayCallsCount() { return todayCallsCount; }
    public void setTodayCallsCount(Integer todayCallsCount) { this.todayCallsCount = todayCallsCount; }

    public Long getAvgDurationSeconds() { return avgDurationSeconds; }
    public void setAvgDurationSeconds(Long avgDurationSeconds) { this.avgDurationSeconds = avgDurationSeconds; }

    public String getAvgDurationFormatted() { return avgDurationFormatted; }
    public void setAvgDurationFormatted(String avgDurationFormatted) { this.avgDurationFormatted = avgDurationFormatted; }

    public Long getLongestCallSeconds() { return longestCallSeconds; }
    public void setLongestCallSeconds(Long longestCallSeconds) { this.longestCallSeconds = longestCallSeconds; }

    public String getLongestCallFormatted() { return longestCallFormatted; }
    public void setLongestCallFormatted(String longestCallFormatted) { this.longestCallFormatted = longestCallFormatted; }

    public CallSessionDto getActiveCallSession() { return activeCallSession; }
    public void setActiveCallSession(CallSessionDto activeCallSession) { this.activeCallSession = activeCallSession; }

    public Long getWeeklyCallTimeSeconds() { return weeklyCallTimeSeconds; }
    public void setWeeklyCallTimeSeconds(Long weeklyCallTimeSeconds) { this.weeklyCallTimeSeconds = weeklyCallTimeSeconds; }

    public String getWeeklyCallTimeFormatted() { return weeklyCallTimeFormatted; }
    public void setWeeklyCallTimeFormatted(String weeklyCallTimeFormatted) { this.weeklyCallTimeFormatted = weeklyCallTimeFormatted; }

    public Long getMonthlyCallTimeSeconds() { return monthlyCallTimeSeconds; }
    public void setMonthlyCallTimeSeconds(Long monthlyCallTimeSeconds) { this.monthlyCallTimeSeconds = monthlyCallTimeSeconds; }

    public String getMonthlyCallTimeFormatted() { return monthlyCallTimeFormatted; }
    public void setMonthlyCallTimeFormatted(String monthlyCallTimeFormatted) { this.monthlyCallTimeFormatted = monthlyCallTimeFormatted; }

    public Integer getTotalTeamCallsToday() { return totalTeamCallsToday; }
    public void setTotalTeamCallsToday(Integer totalTeamCallsToday) { this.totalTeamCallsToday = totalTeamCallsToday; }

    public Long getTotalTeamCallTimeSeconds() { return totalTeamCallTimeSeconds; }
    public void setTotalTeamCallTimeSeconds(Long totalTeamCallTimeSeconds) { this.totalTeamCallTimeSeconds = totalTeamCallTimeSeconds; }

    public String getTotalTeamCallTimeFormatted() { return totalTeamCallTimeFormatted; }
    public void setTotalTeamCallTimeFormatted(String totalTeamCallTimeFormatted) { this.totalTeamCallTimeFormatted = totalTeamCallTimeFormatted; }

    public String getTopCallingUser() { return topCallingUser; }
    public void setTopCallingUser(String topCallingUser) { this.topCallingUser = topCallingUser; }

    public String getLeastActiveUser() { return leastActiveUser; }
    public void setLeastActiveUser(String leastActiveUser) { this.leastActiveUser = leastActiveUser; }

    public List<Map<String, Object>> getDailyCallDurationChart() { return dailyCallDurationChart; }
    public void setDailyCallDurationChart(List<Map<String, Object>> dailyCallDurationChart) { this.dailyCallDurationChart = dailyCallDurationChart; }

    public List<Map<String, Object>> getUserProductivityLeaderboard() { return userProductivityLeaderboard; }
    public void setUserProductivityLeaderboard(List<Map<String, Object>> userProductivityLeaderboard) { this.userProductivityLeaderboard = userProductivityLeaderboard; }
}
