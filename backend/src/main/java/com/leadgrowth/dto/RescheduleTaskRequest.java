package com.leadgrowth.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class RescheduleTaskRequest {

    @NotNull(message = "New date is required")
    private LocalDate newDate;

    private String newTime; // e.g. "14:30"
    private String priority; // Low, Medium, High, Urgent
    private Integer reminderMinutes; // 15, 30, 60, etc.
    private String notes; // Reason / instructions

    public RescheduleTaskRequest() {}

    public RescheduleTaskRequest(LocalDate newDate, String newTime, String priority, Integer reminderMinutes, String notes) {
        this.newDate = newDate;
        this.newTime = newTime;
        this.priority = priority;
        this.reminderMinutes = reminderMinutes;
        this.notes = notes;
    }

    public LocalDate getNewDate() { return newDate; }
    public void setNewDate(LocalDate newDate) { this.newDate = newDate; }

    public String getNewTime() { return newTime; }
    public void setNewTime(String newTime) { this.newTime = newTime; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public Integer getReminderMinutes() { return reminderMinutes; }
    public void setReminderMinutes(Integer reminderMinutes) { this.reminderMinutes = reminderMinutes; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
