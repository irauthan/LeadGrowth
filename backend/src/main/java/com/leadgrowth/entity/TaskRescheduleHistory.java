package com.leadgrowth.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "scheduled_tasks")
public class TaskRescheduleHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    private Task task;

    @Column(name = "old_due_date")
    private LocalDate oldDueDate;

    @Column(name = "new_due_date", nullable = false)
    private LocalDate newDueDate;

    @Column(name = "old_due_time", length = 20)
    private String oldDueTime;

    @Column(name = "new_due_time", length = 20)
    private String newDueTime;

    @Column(name = "old_priority", length = 20)
    private String oldPriority;

    @Column(name = "new_priority", length = 20)
    private String newPriority;

    @Column(name = "reminder_minutes")
    private Integer reminderMinutes;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rescheduled_by_id")
    private User rescheduledBy;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public TaskRescheduleHistory() {}

    public TaskRescheduleHistory(Long id, Workspace workspace, Task task, LocalDate oldDueDate, LocalDate newDueDate,
                                 String oldDueTime, String newDueTime, String oldPriority, String newPriority,
                                 Integer reminderMinutes, String notes, User rescheduledBy, LocalDateTime createdAt) {
        this.id = id;
        this.workspace = workspace;
        this.task = task;
        this.oldDueDate = oldDueDate;
        this.newDueDate = newDueDate;
        this.oldDueTime = oldDueTime;
        this.newDueTime = newDueTime;
        this.oldPriority = oldPriority;
        this.newPriority = newPriority;
        this.reminderMinutes = reminderMinutes;
        this.notes = notes;
        this.rescheduledBy = rescheduledBy;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Workspace getWorkspace() { return workspace; }
    public void setWorkspace(Workspace workspace) { this.workspace = workspace; }

    public Task getTask() { return task; }
    public void setTask(Task task) { this.task = task; }

    public LocalDate getOldDueDate() { return oldDueDate; }
    public void setOldDueDate(LocalDate oldDueDate) { this.oldDueDate = oldDueDate; }

    public LocalDate getNewDueDate() { return newDueDate; }
    public void setNewDueDate(LocalDate newDueDate) { this.newDueDate = newDueDate; }

    public String getOldDueTime() { return oldDueTime; }
    public void setOldDueTime(String oldDueTime) { this.oldDueTime = oldDueTime; }

    public String getNewDueTime() { return newDueTime; }
    public void setNewDueTime(String newDueTime) { this.newDueTime = newDueTime; }

    public String getOldPriority() { return oldPriority; }
    public void setOldPriority(String oldPriority) { this.oldPriority = oldPriority; }

    public String getNewPriority() { return newPriority; }
    public void setNewPriority(String newPriority) { this.newPriority = newPriority; }

    public Integer getReminderMinutes() { return reminderMinutes; }
    public void setReminderMinutes(Integer reminderMinutes) { this.reminderMinutes = reminderMinutes; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public User getRescheduledBy() { return rescheduledBy; }
    public void setRescheduledBy(User rescheduledBy) { this.rescheduledBy = rescheduledBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public static TaskRescheduleHistoryBuilder builder() {
        return new TaskRescheduleHistoryBuilder();
    }

    public static class TaskRescheduleHistoryBuilder {
        private Long id;
        private Workspace workspace;
        private Task task;
        private LocalDate oldDueDate;
        private LocalDate newDueDate;
        private String oldDueTime;
        private String newDueTime;
        private String oldPriority;
        private String newPriority;
        private Integer reminderMinutes;
        private String notes;
        private User rescheduledBy;
        private LocalDateTime createdAt;

        TaskRescheduleHistoryBuilder() {}

        public TaskRescheduleHistoryBuilder id(Long id) { this.id = id; return this; }
        public TaskRescheduleHistoryBuilder workspace(Workspace workspace) { this.workspace = workspace; return this; }
        public TaskRescheduleHistoryBuilder task(Task task) { this.task = task; return this; }
        public TaskRescheduleHistoryBuilder oldDueDate(LocalDate oldDueDate) { this.oldDueDate = oldDueDate; return this; }
        public TaskRescheduleHistoryBuilder newDueDate(LocalDate newDueDate) { this.newDueDate = newDueDate; return this; }
        public TaskRescheduleHistoryBuilder oldDueTime(String oldDueTime) { this.oldDueTime = oldDueTime; return this; }
        public TaskRescheduleHistoryBuilder newDueTime(String newDueTime) { this.newDueTime = newDueTime; return this; }
        public TaskRescheduleHistoryBuilder oldPriority(String oldPriority) { this.oldPriority = oldPriority; return this; }
        public TaskRescheduleHistoryBuilder newPriority(String newPriority) { this.newPriority = newPriority; return this; }
        public TaskRescheduleHistoryBuilder reminderMinutes(Integer reminderMinutes) { this.reminderMinutes = reminderMinutes; return this; }
        public TaskRescheduleHistoryBuilder notes(String notes) { this.notes = notes; return this; }
        public TaskRescheduleHistoryBuilder rescheduledBy(User rescheduledBy) { this.rescheduledBy = rescheduledBy; return this; }
        public TaskRescheduleHistoryBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public TaskRescheduleHistory build() {
            return new TaskRescheduleHistory(id, workspace, task, oldDueDate, newDueDate, oldDueTime, newDueTime, oldPriority, newPriority, reminderMinutes, notes, rescheduledBy, createdAt);
        }
    }
}
