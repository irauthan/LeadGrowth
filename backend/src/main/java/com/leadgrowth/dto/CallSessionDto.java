package com.leadgrowth.dto;

import java.time.LocalDateTime;

public class CallSessionDto {
    private Long id;
    private Long leadId;
    private String leadName;
    private String leadPhone;
    private String leadCompany;
    private Long userId;
    private String userName;
    private String userEmail;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Long durationSeconds;
    private Double durationMinutes;
    private String formattedDuration;
    private String status;
    private String notes;
    private LocalDateTime createdAt;

    public CallSessionDto() {}

    public CallSessionDto(Long id, Long leadId, String leadName, String leadPhone, String leadCompany, Long userId, String userName, String userEmail, LocalDateTime startTime, LocalDateTime endTime, Long durationSeconds, Double durationMinutes, String formattedDuration, String status, String notes, LocalDateTime createdAt) {
        this.id = id;
        this.leadId = leadId;
        this.leadName = leadName;
        this.leadPhone = leadPhone;
        this.leadCompany = leadCompany;
        this.userId = userId;
        this.userName = userName;
        this.userEmail = userEmail;
        this.startTime = startTime;
        this.endTime = endTime;
        this.durationSeconds = durationSeconds;
        this.durationMinutes = durationMinutes;
        this.formattedDuration = formattedDuration;
        this.status = status;
        this.notes = notes;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getLeadId() { return leadId; }
    public void setLeadId(Long leadId) { this.leadId = leadId; }

    public String getLeadName() { return leadName; }
    public void setLeadName(String leadName) { this.leadName = leadName; }

    public String getLeadPhone() { return leadPhone; }
    public void setLeadPhone(String leadPhone) { this.leadPhone = leadPhone; }

    public String getLeadCompany() { return leadCompany; }
    public void setLeadCompany(String leadCompany) { this.leadCompany = leadCompany; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }

    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }

    public Long getDurationSeconds() { return durationSeconds; }
    public void setDurationSeconds(Long durationSeconds) { this.durationSeconds = durationSeconds; }

    public Double getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Double durationMinutes) { this.durationMinutes = durationMinutes; }

    public String getFormattedDuration() { return formattedDuration; }
    public void setFormattedDuration(String formattedDuration) { this.formattedDuration = formattedDuration; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
