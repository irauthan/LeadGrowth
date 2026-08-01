package com.leadgrowth.dto;

import java.time.LocalDateTime;

public class CalendarEventDto {

    private Long id;
    private Long workspaceId;
    private String title;
    private String description;
    private String eventType;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Boolean allDay;
    private Long leadId;
    private String leadName;
    private String leadStage;
    private Long assignedUserId;
    private String assignedUserName;
    private String priority;
    private Integer reminderMinutes;
    private Boolean reminderSent;
    private String status;
    private String sourceType;
    private Long sourceId;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public CalendarEventDto() {}

    public CalendarEventDto(Long id, Long workspaceId, String title, String description, String eventType,
                            LocalDateTime startTime, LocalDateTime endTime, Boolean allDay, Long leadId,
                            String leadName, String leadStage, Long assignedUserId, String assignedUserName,
                            String priority, Integer reminderMinutes, Boolean reminderSent, String status,
                            String sourceType, Long sourceId, String notes, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.workspaceId = workspaceId;
        this.title = title;
        this.description = description;
        this.eventType = eventType;
        this.startTime = startTime;
        this.endTime = endTime;
        this.allDay = allDay;
        this.leadId = leadId;
        this.leadName = leadName;
        this.leadStage = leadStage;
        this.assignedUserId = assignedUserId;
        this.assignedUserName = assignedUserName;
        this.priority = priority;
        this.reminderMinutes = reminderMinutes;
        this.reminderSent = reminderSent;
        this.status = status;
        this.sourceType = sourceType;
        this.sourceId = sourceId;
        this.notes = notes;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getWorkspaceId() { return workspaceId; }
    public void setWorkspaceId(Long workspaceId) { this.workspaceId = workspaceId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }

    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }

    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }

    public Boolean getAllDay() { return allDay; }
    public void setAllDay(Boolean allDay) { this.allDay = allDay; }

    public Long getLeadId() { return leadId; }
    public void setLeadId(Long leadId) { this.leadId = leadId; }

    public String getLeadName() { return leadName; }
    public void setLeadName(String leadName) { this.leadName = leadName; }

    public String getLeadStage() { return leadStage; }
    public void setLeadStage(String leadStage) { this.leadStage = leadStage; }

    public Long getAssignedUserId() { return assignedUserId; }
    public void setAssignedUserId(Long assignedUserId) { this.assignedUserId = assignedUserId; }

    public String getAssignedUserName() { return assignedUserName; }
    public void setAssignedUserName(String assignedUserName) { this.assignedUserName = assignedUserName; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public Integer getReminderMinutes() { return reminderMinutes; }
    public void setReminderMinutes(Integer reminderMinutes) { this.reminderMinutes = reminderMinutes; }

    public Boolean getReminderSent() { return reminderSent; }
    public void setReminderSent(Boolean reminderSent) { this.reminderSent = reminderSent; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getSourceType() { return sourceType; }
    public void setSourceType(String sourceType) { this.sourceType = sourceType; }

    public Long getSourceId() { return sourceId; }
    public void setSourceId(Long sourceId) { this.sourceId = sourceId; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public static CalendarEventDtoBuilder builder() {
        return new CalendarEventDtoBuilder();
    }

    public static class CalendarEventDtoBuilder {
        private Long id;
        private Long workspaceId;
        private String title;
        private String description;
        private String eventType;
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        private Boolean allDay;
        private Long leadId;
        private String leadName;
        private String leadStage;
        private Long assignedUserId;
        private String assignedUserName;
        private String priority;
        private Integer reminderMinutes;
        private Boolean reminderSent;
        private String status;
        private String sourceType;
        private Long sourceId;
        private String notes;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        CalendarEventDtoBuilder() {}

        public CalendarEventDtoBuilder id(Long id) { this.id = id; return this; }
        public CalendarEventDtoBuilder workspaceId(Long workspaceId) { this.workspaceId = workspaceId; return this; }
        public CalendarEventDtoBuilder title(String title) { this.title = title; return this; }
        public CalendarEventDtoBuilder description(String description) { this.description = description; return this; }
        public CalendarEventDtoBuilder eventType(String eventType) { this.eventType = eventType; return this; }
        public CalendarEventDtoBuilder startTime(LocalDateTime startTime) { this.startTime = startTime; return this; }
        public CalendarEventDtoBuilder endTime(LocalDateTime endTime) { this.endTime = endTime; return this; }
        public CalendarEventDtoBuilder allDay(Boolean allDay) { this.allDay = allDay; return this; }
        public CalendarEventDtoBuilder leadId(Long leadId) { this.leadId = leadId; return this; }
        public CalendarEventDtoBuilder leadName(String leadName) { this.leadName = leadName; return this; }
        public CalendarEventDtoBuilder leadStage(String leadStage) { this.leadStage = leadStage; return this; }
        public CalendarEventDtoBuilder assignedUserId(Long assignedUserId) { this.assignedUserId = assignedUserId; return this; }
        public CalendarEventDtoBuilder assignedUserName(String assignedUserName) { this.assignedUserName = assignedUserName; return this; }
        public CalendarEventDtoBuilder priority(String priority) { this.priority = priority; return this; }
        public CalendarEventDtoBuilder reminderMinutes(Integer reminderMinutes) { this.reminderMinutes = reminderMinutes; return this; }
        public CalendarEventDtoBuilder reminderSent(Boolean reminderSent) { this.reminderSent = reminderSent; return this; }
        public CalendarEventDtoBuilder status(String status) { this.status = status; return this; }
        public CalendarEventDtoBuilder sourceType(String sourceType) { this.sourceType = sourceType; return this; }
        public CalendarEventDtoBuilder sourceId(Long sourceId) { this.sourceId = sourceId; return this; }
        public CalendarEventDtoBuilder notes(String notes) { this.notes = notes; return this; }
        public CalendarEventDtoBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public CalendarEventDtoBuilder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }

        public CalendarEventDto build() {
            return new CalendarEventDto(id, workspaceId, title, description, eventType, startTime, endTime, allDay, leadId, leadName, leadStage, assignedUserId, assignedUserName, priority, reminderMinutes, reminderSent, status, sourceType, sourceId, notes, createdAt, updatedAt);
        }
    }
}
