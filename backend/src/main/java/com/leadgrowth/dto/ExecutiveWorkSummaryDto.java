package com.leadgrowth.dto;

import java.util.List;

public class ExecutiveWorkSummaryDto {
    private Long userId;
    private String userName;
    private String userEmail;
    private String userRole;
    private String profileImage;
    private String timeframe; // TODAY, YESTERDAY, THIS_WEEK, THIS_MONTH, CUSTOM

    private long totalAssignedLeads;
    private long totalActivitiesLogged;
    private long totalCallsMade;
    private long totalMeetingsHeld;
    private long totalEmailsSent;
    private long totalWhatsappSent;
    private long completedFollowupsCount;
    private long overdueFollowupsCount;
    private long totalConvertedLeads;

    private double conversionRate;
    private double activityCompletionRate;

    private List<ExecutiveDayBreakdownDto> dailyBreakdown;
    private List<ExecutiveLeadWorkDto> leadWorkList;

    public ExecutiveWorkSummaryDto() {}

    public ExecutiveWorkSummaryDto(Long userId, String userName, String userEmail, String userRole, String profileImage, String timeframe, long totalAssignedLeads, long totalActivitiesLogged, long totalCallsMade, long totalMeetingsHeld, long totalEmailsSent, long totalWhatsappSent, long completedFollowupsCount, long overdueFollowupsCount, long totalConvertedLeads, double conversionRate, double activityCompletionRate, List<ExecutiveDayBreakdownDto> dailyBreakdown, List<ExecutiveLeadWorkDto> leadWorkList) {
        this.userId = userId;
        this.userName = userName;
        this.userEmail = userEmail;
        this.userRole = userRole;
        this.profileImage = profileImage;
        this.timeframe = timeframe;
        this.totalAssignedLeads = totalAssignedLeads;
        this.totalActivitiesLogged = totalActivitiesLogged;
        this.totalCallsMade = totalCallsMade;
        this.totalMeetingsHeld = totalMeetingsHeld;
        this.totalEmailsSent = totalEmailsSent;
        this.totalWhatsappSent = totalWhatsappSent;
        this.completedFollowupsCount = completedFollowupsCount;
        this.overdueFollowupsCount = overdueFollowupsCount;
        this.totalConvertedLeads = totalConvertedLeads;
        this.conversionRate = conversionRate;
        this.activityCompletionRate = activityCompletionRate;
        this.dailyBreakdown = dailyBreakdown;
        this.leadWorkList = leadWorkList;
    }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public String getUserRole() { return userRole; }
    public void setUserRole(String userRole) { this.userRole = userRole; }

    public String getProfileImage() { return profileImage; }
    public void setProfileImage(String profileImage) { this.profileImage = profileImage; }

    public String getTimeframe() { return timeframe; }
    public void setTimeframe(String timeframe) { this.timeframe = timeframe; }

    public long getTotalAssignedLeads() { return totalAssignedLeads; }
    public void setTotalAssignedLeads(long totalAssignedLeads) { this.totalAssignedLeads = totalAssignedLeads; }

    public long getTotalActivitiesLogged() { return totalActivitiesLogged; }
    public void setTotalActivitiesLogged(long totalActivitiesLogged) { this.totalActivitiesLogged = totalActivitiesLogged; }

    public long getTotalCallsMade() { return totalCallsMade; }
    public void setTotalCallsMade(long totalCallsMade) { this.totalCallsMade = totalCallsMade; }

    public long getTotalMeetingsHeld() { return totalMeetingsHeld; }
    public void setTotalMeetingsHeld(long totalMeetingsHeld) { this.totalMeetingsHeld = totalMeetingsHeld; }

    public long getTotalEmailsSent() { return totalEmailsSent; }
    public void setTotalEmailsSent(long totalEmailsSent) { this.totalEmailsSent = totalEmailsSent; }

    public long getTotalWhatsappSent() { return totalWhatsappSent; }
    public void setTotalWhatsappSent(long totalWhatsappSent) { this.totalWhatsappSent = totalWhatsappSent; }

    public long getCompletedFollowupsCount() { return completedFollowupsCount; }
    public void setCompletedFollowupsCount(long completedFollowupsCount) { this.completedFollowupsCount = completedFollowupsCount; }

    public long getOverdueFollowupsCount() { return overdueFollowupsCount; }
    public void setOverdueFollowupsCount(long overdueFollowupsCount) { this.overdueFollowupsCount = overdueFollowupsCount; }

    public long getTotalConvertedLeads() { return totalConvertedLeads; }
    public void setTotalConvertedLeads(long totalConvertedLeads) { this.totalConvertedLeads = totalConvertedLeads; }

    public double getConversionRate() { return conversionRate; }
    public void setConversionRate(double conversionRate) { this.conversionRate = conversionRate; }

    public double getActivityCompletionRate() { return activityCompletionRate; }
    public void setActivityCompletionRate(double activityCompletionRate) { this.activityCompletionRate = activityCompletionRate; }

    public List<ExecutiveDayBreakdownDto> getDailyBreakdown() { return dailyBreakdown; }
    public void setDailyBreakdown(List<ExecutiveDayBreakdownDto> dailyBreakdown) { this.dailyBreakdown = dailyBreakdown; }

    public List<ExecutiveLeadWorkDto> getLeadWorkList() { return leadWorkList; }
    public void setLeadWorkList(List<ExecutiveLeadWorkDto> leadWorkList) { this.leadWorkList = leadWorkList; }
}
