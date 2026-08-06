package com.leadgrowth.dto;

public class ExecutiveDayBreakdownDto {
    private String date; // YYYY-MM-DD
    private String dayOfWeek;
    private long callsCount;
    private long meetingsCount;
    private long emailsCount;
    private long whatsappCount;
    private long totalActivitiesCount;
    private long followupsCompletedCount;

    public ExecutiveDayBreakdownDto() {}

    public ExecutiveDayBreakdownDto(String date, String dayOfWeek, long callsCount, long meetingsCount, long emailsCount, long whatsappCount, long totalActivitiesCount, long followupsCompletedCount) {
        this.date = date;
        this.dayOfWeek = dayOfWeek;
        this.callsCount = callsCount;
        this.meetingsCount = meetingsCount;
        this.emailsCount = emailsCount;
        this.whatsappCount = whatsappCount;
        this.totalActivitiesCount = totalActivitiesCount;
        this.followupsCompletedCount = followupsCompletedCount;
    }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getDayOfWeek() { return dayOfWeek; }
    public void setDayOfWeek(String dayOfWeek) { this.dayOfWeek = dayOfWeek; }

    public long getCallsCount() { return callsCount; }
    public void setCallsCount(long callsCount) { this.callsCount = callsCount; }

    public long getMeetingsCount() { return meetingsCount; }
    public void setMeetingsCount(long meetingsCount) { this.meetingsCount = meetingsCount; }

    public long getEmailsCount() { return emailsCount; }
    public void setEmailsCount(long emailsCount) { this.emailsCount = emailsCount; }

    public long getWhatsappCount() { return whatsappCount; }
    public void setWhatsappCount(long whatsappCount) { this.whatsappCount = whatsappCount; }

    public long getTotalActivitiesCount() { return totalActivitiesCount; }
    public void setTotalActivitiesCount(long totalActivitiesCount) { this.totalActivitiesCount = totalActivitiesCount; }

    public long getFollowupsCompletedCount() { return followupsCompletedCount; }
    public void setFollowupsCompletedCount(long followupsCompletedCount) { this.followupsCompletedCount = followupsCompletedCount; }
}
