package com.leadgrowth.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "calendar_events")
public class CalendarEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    // FOLLOW_UP, MEETING, PERSONAL_REMINDER, TASK, CALL_REMINDER, DEADLINE, LEAD_REMINDER
    @Column(name = "event_type", nullable = false, length = 30)
    private String eventType;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Column(name = "all_day")
    private Boolean allDay = false;

    @Column(name = "lead_id")
    private Long leadId;

    @Column(name = "lead_name", length = 150)
    private String leadName;

    @Column(name = "lead_stage", length = 50)
    private String leadStage;

    @Column(name = "assigned_user_id")
    private Long assignedUserId;

    @Column(name = "assigned_user_name", length = 150)
    private String assignedUserName;

    @Column(length = 20)
    private String priority; // Low, Medium, High, Urgent

    @Column(name = "reminder_minutes")
    private Integer reminderMinutes; // 15, 30, 60, custom

    @Column(name = "reminder_sent")
    private Boolean reminderSent = false;

    // PENDING, COMPLETED, CANCELLED, RESCHEDULED
    @Column(nullable = false, length = 20)
    private String status = "PENDING";

    @Column(name = "source_type", length = 50) // FOLLOWUP, TASK, LEAD_REMINDER, MANUAL
    private String sourceType;

    @Column(name = "source_id")
    private Long sourceId;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.status == null) this.status = "PENDING";
        if (this.reminderSent == null) this.reminderSent = false;
        if (this.allDay == null) this.allDay = false;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public CalendarEvent() {}

    public CalendarEvent(Long id, Workspace workspace, String title, String description, String eventType,
                         LocalDateTime startTime, LocalDateTime endTime, Boolean allDay, Long leadId,
                         String leadName, String leadStage, Long assignedUserId, String assignedUserName,
                         String priority, Integer reminderMinutes, Boolean reminderSent, String status,
                         String sourceType, Long sourceId, String notes, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.workspace = workspace;
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

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Workspace getWorkspace() { return workspace; }
    public void setWorkspace(Workspace workspace) { this.workspace = workspace; }

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

    public static CalendarEventBuilder builder() {
        return new CalendarEventBuilder();
    }

    public static class CalendarEventBuilder {
        private Long id;
        private Workspace workspace;
        private String title;
        private String description;
        private String eventType;
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        private Boolean allDay = false;
        private Long leadId;
        private String leadName;
        private String leadStage;
        private Long assignedUserId;
        private String assignedUserName;
        private String priority;
        private Integer reminderMinutes;
        private Boolean reminderSent = false;
        private String status = "PENDING";
        private String sourceType;
        private Long sourceId;
        private String notes;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        CalendarEventBuilder() {}

        public CalendarEventBuilder id(Long id) { this.id = id; return this; }
        public CalendarEventBuilder workspace(Workspace workspace) { this.workspace = workspace; return this; }
        public CalendarEventBuilder title(String title) { this.title = title; return this; }
        public CalendarEventBuilder description(String description) { this.description = description; return this; }
        public CalendarEventBuilder eventType(String eventType) { this.eventType = eventType; return this; }
        public CalendarEventBuilder startTime(LocalDateTime startTime) { this.startTime = startTime; return this; }
        public CalendarEventBuilder endTime(LocalDateTime endTime) { this.endTime = endTime; return this; }
        public CalendarEventBuilder allDay(Boolean allDay) { this.allDay = allDay; return this; }
        public CalendarEventBuilder leadId(Long leadId) { this.leadId = leadId; return this; }
        public CalendarEventBuilder leadName(String leadName) { this.leadName = leadName; return this; }
        public CalendarEventBuilder leadStage(String leadStage) { this.leadStage = leadStage; return this; }
        public CalendarEventBuilder assignedUserId(Long assignedUserId) { this.assignedUserId = assignedUserId; return this; }
        public CalendarEventBuilder assignedUserName(String assignedUserName) { this.assignedUserName = assignedUserName; return this; }
        public CalendarEventBuilder priority(String priority) { this.priority = priority; return this; }
        public CalendarEventBuilder reminderMinutes(Integer reminderMinutes) { this.reminderMinutes = reminderMinutes; return this; }
        public CalendarEventBuilder reminderSent(Boolean reminderSent) { this.reminderSent = reminderSent; return this; }
        public CalendarEventBuilder status(String status) { this.status = status; return this; }
        public CalendarEventBuilder sourceType(String sourceType) { this.sourceType = sourceType; return this; }
        public CalendarEventBuilder sourceId(Long sourceId) { this.sourceId = sourceId; return this; }
        public CalendarEventBuilder notes(String notes) { this.notes = notes; return this; }
        public CalendarEventBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public CalendarEventBuilder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }

        public CalendarEvent build() {
            return new CalendarEvent(id, workspace, title, description, eventType, startTime, endTime, allDay, leadId, leadName, leadStage, assignedUserId, assignedUserName, priority, reminderMinutes, reminderSent, status, sourceType, sourceId, notes, createdAt, updatedAt);
        }
    }
}
