package com.leadgrowth.service;

import com.leadgrowth.dto.CalendarEventDto;
import com.leadgrowth.dto.CreateCalendarEventRequest;
import com.leadgrowth.entity.CalendarEvent;
import com.leadgrowth.entity.FollowupReminder;
import com.leadgrowth.entity.Task;
import com.leadgrowth.entity.User;
import com.leadgrowth.entity.Workspace;
import com.leadgrowth.repository.CalendarEventRepository;
import com.leadgrowth.repository.FollowupRepository;
import com.leadgrowth.repository.TaskRepository;
import com.leadgrowth.repository.UserRepository;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CalendarService {

    private final CalendarEventRepository calendarEventRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final FollowupRepository followupRepository;

    public CalendarService(
            CalendarEventRepository calendarEventRepository,
            UserRepository userRepository,
            TaskRepository taskRepository,
            FollowupRepository followupRepository
    ) {
        this.calendarEventRepository = calendarEventRepository;
        this.userRepository = userRepository;
        this.taskRepository = taskRepository;
        this.followupRepository = followupRepository;
    }

    public List<CalendarEventDto> getCalendarEvents(String userEmail, String startStr, String endStr) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        Workspace workspace = user.getWorkspace();
        if (workspace == null) {
            throw new IllegalStateException("User does not belong to a workspace");
        }

        // Auto-sync tasks & followups for workspace first to ensure complete schedule
        syncWorkspaceTasksAndFollowups(workspace);

        List<CalendarEvent> events;
        if (startStr != null && endStr != null && !startStr.isEmpty() && !endStr.isEmpty()) {
            LocalDateTime start = parseDateTime(startStr, true);
            LocalDateTime end = parseDateTime(endStr, false);
            events = calendarEventRepository.findByWorkspaceIdAndDateRange(workspace.getId(), start, end);
        } else {
            events = calendarEventRepository.findByWorkspaceIdOrderByStartTimeAsc(workspace.getId());
        }

        return events.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    @Transactional
    public CalendarEventDto createEvent(CreateCalendarEventRequest req, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        Workspace workspace = user.getWorkspace();

        LocalDateTime start = req.getStartTime();
        LocalDateTime end = req.getEndTime() != null ? req.getEndTime() : start.plusHours(1);

        String assignedName = null;
        Long assignedId = req.getAssignedUserId();
        if (assignedId != null) {
            User assigned = userRepository.findById(assignedId).orElse(null);
            if (assigned != null) assignedName = assigned.getFullName();
        } else {
            assignedId = user.getId();
            assignedName = user.getFullName();
        }

        CalendarEvent event = CalendarEvent.builder()
                .workspace(workspace)
                .title(req.getTitle())
                .description(req.getDescription())
                .eventType(req.getEventType())
                .startTime(start)
                .endTime(end)
                .allDay(req.getAllDay() != null ? req.getAllDay() : false)
                .leadId(req.getLeadId())
                .leadName(req.getLeadName())
                .leadStage(req.getLeadStage())
                .assignedUserId(assignedId)
                .assignedUserName(assignedName)
                .priority(req.getPriority() != null ? req.getPriority() : "Medium")
                .reminderMinutes(req.getReminderMinutes() != null ? req.getReminderMinutes() : 15)
                .reminderSent(false)
                .status("PENDING")
                .sourceType("MANUAL")
                .notes(req.getNotes())
                .build();

        event = calendarEventRepository.save(event);
        return convertToDto(event);
    }

    @Transactional
    public CalendarEventDto updateEvent(Long eventId, CreateCalendarEventRequest req, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        CalendarEvent event = calendarEventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Calendar event not found"));

        if (!event.getWorkspace().getId().equals(user.getWorkspace().getId())) {
            throw new IllegalStateException("Unauthorized access to workspace calendar event");
        }

        if (req.getTitle() != null) event.setTitle(req.getTitle());
        if (req.getDescription() != null) event.setDescription(req.getDescription());
        if (req.getEventType() != null) event.setEventType(req.getEventType());
        if (req.getStartTime() != null) event.setStartTime(req.getStartTime());
        if (req.getEndTime() != null) event.setEndTime(req.getEndTime());
        if (req.getAllDay() != null) event.setAllDay(req.getAllDay());
        if (req.getLeadId() != null) event.setLeadId(req.getLeadId());
        if (req.getLeadName() != null) event.setLeadName(req.getLeadName());
        if (req.getLeadStage() != null) event.setLeadStage(req.getLeadStage());
        if (req.getPriority() != null) event.setPriority(req.getPriority());
        if (req.getReminderMinutes() != null) event.setReminderMinutes(req.getReminderMinutes());
        if (req.getNotes() != null) event.setNotes(req.getNotes());

        event = calendarEventRepository.save(event);
        return convertToDto(event);
    }

    @Transactional
    public CalendarEventDto completeEvent(Long eventId, String userEmail) {
        CalendarEvent event = calendarEventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Calendar event not found"));
        event.setStatus("COMPLETED");
        event = calendarEventRepository.save(event);
        return convertToDto(event);
    }

    @Transactional
    public void deleteEvent(Long eventId, String userEmail) {
        CalendarEvent event = calendarEventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Calendar event not found"));
        calendarEventRepository.delete(event);
    }

    @Transactional
    public void syncTaskToCalendar(Task task) {
        if (task == null || task.getWorkspace() == null) return;
        Long workspaceId = task.getWorkspace().getId();

        List<CalendarEvent> existing = calendarEventRepository.findByWorkspaceIdAndSourceTypeAndSourceId(
                workspaceId, "TASK", task.getId()
        );

        LocalDate dueDate = task.getDueDate() != null ? task.getDueDate() : LocalDate.now();
        LocalTime time = parseTimeOrDefault(task.getDueTime(), LocalTime.of(10, 0));
        LocalDateTime start = LocalDateTime.of(dueDate, time);
        LocalDateTime end = start.plusHours(1);

        String assignedName = task.getAssignedTo() != null ? task.getAssignedTo().getFullName() : "Unassigned";
        Long assignedId = task.getAssignedTo() != null ? task.getAssignedTo().getId() : null;

        String status = "Completed".equalsIgnoreCase(task.getStatus()) || "APPROVED".equalsIgnoreCase(task.getStatus())
                ? "COMPLETED" : "PENDING";

        if (!existing.isEmpty()) {
            CalendarEvent event = existing.get(0);
            event.setTitle("Task: " + task.getTitle());
            event.setDescription(task.getDescription());
            event.setStartTime(start);
            event.setEndTime(end);
            event.setPriority(task.getPriority());
            event.setAssignedUserId(assignedId);
            event.setAssignedUserName(assignedName);
            event.setStatus(status);
            if (task.getReminderMinutes() != null) event.setReminderMinutes(task.getReminderMinutes());
            if (task.getRescheduleNotes() != null) event.setNotes(task.getRescheduleNotes());
            calendarEventRepository.save(event);
        } else {
            CalendarEvent event = CalendarEvent.builder()
                    .workspace(task.getWorkspace())
                    .title("Task: " + task.getTitle())
                    .description(task.getDescription())
                    .eventType("TASK")
                    .startTime(start)
                    .endTime(end)
                    .assignedUserId(assignedId)
                    .assignedUserName(assignedName)
                    .priority(task.getPriority() != null ? task.getPriority() : "Medium")
                    .reminderMinutes(task.getReminderMinutes() != null ? task.getReminderMinutes() : 15)
                    .status(status)
                    .sourceType("TASK")
                    .sourceId(task.getId())
                    .notes(task.getRescheduleNotes())
                    .build();
            calendarEventRepository.save(event);
        }
    }

    @Transactional
    public void syncFollowupToCalendar(FollowupReminder followup) {
        if (followup == null || followup.getWorkspace() == null) return;
        Long workspaceId = followup.getWorkspace().getId();

        List<CalendarEvent> existing = calendarEventRepository.findByWorkspaceIdAndSourceTypeAndSourceId(
                workspaceId, "FOLLOWUP", followup.getId()
        );

        LocalDateTime start = followup.getScheduledAt() != null ? followup.getScheduledAt() : LocalDateTime.now();
        LocalDateTime end = start.plusMinutes(30);

        String leadName = followup.getLead() != null ? followup.getLead().getName() : "Lead";
        Long leadId = followup.getLead() != null ? followup.getLead().getId() : null;
        String leadStage = followup.getLead() != null ? followup.getLead().getStatus() : "Active";

        Long assignedId = (followup.getLead() != null && followup.getLead().getAssignedTo() != null)
                ? followup.getLead().getAssignedTo().getId() : null;
        String assignedName = (followup.getLead() != null && followup.getLead().getAssignedTo() != null)
                ? followup.getLead().getAssignedTo().getFullName() : "Specialist";

        String status = "COMPLETED".equalsIgnoreCase(followup.getStatus()) ? "COMPLETED" : "PENDING";

        if (!existing.isEmpty()) {
            CalendarEvent event = existing.get(0);
            event.setTitle("Follow-up: " + leadName + " (" + (followup.getType() != null ? followup.getType() : "Call") + ")");
            event.setDescription(followup.getNotes());
            event.setStartTime(start);
            event.setEndTime(end);
            event.setLeadId(leadId);
            event.setLeadName(leadName);
            event.setLeadStage(leadStage);
            event.setAssignedUserId(assignedId);
            event.setAssignedUserName(assignedName);
            event.setStatus(status);
            calendarEventRepository.save(event);
        } else {
            CalendarEvent event = CalendarEvent.builder()
                    .workspace(followup.getWorkspace())
                    .title("Follow-up: " + leadName + " (" + (followup.getType() != null ? followup.getType() : "Call") + ")")
                    .description(followup.getNotes())
                    .eventType("FOLLOW_UP")
                    .startTime(start)
                    .endTime(end)
                    .leadId(leadId)
                    .leadName(leadName)
                    .leadStage(leadStage)
                    .assignedUserId(assignedId)
                    .assignedUserName(assignedName)
                    .priority("High")
                    .reminderMinutes(30)
                    .status(status)
                    .sourceType("FOLLOWUP")
                    .sourceId(followup.getId())
                    .notes(followup.getNotes())
                    .build();
            calendarEventRepository.save(event);
        }
    }

    private void syncWorkspaceTasksAndFollowups(Workspace workspace) {
        List<Task> tasks = taskRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspace.getId());
        for (Task t : tasks) {
            syncTaskToCalendar(t);
        }
        List<FollowupReminder> followups = followupRepository.findByWorkspaceIdOrderByScheduledAtAsc(workspace.getId());
        for (FollowupReminder f : followups) {
            syncFollowupToCalendar(f);
        }
    }

    private CalendarEventDto convertToDto(CalendarEvent event) {
        return CalendarEventDto.builder()
                .id(event.getId())
                .workspaceId(event.getWorkspace().getId())
                .title(event.getTitle())
                .description(event.getDescription())
                .eventType(event.getEventType())
                .startTime(event.getStartTime())
                .endTime(event.getEndTime())
                .allDay(event.getAllDay())
                .leadId(event.getLeadId())
                .leadName(event.getLeadName())
                .leadStage(event.getLeadStage())
                .assignedUserId(event.getAssignedUserId())
                .assignedUserName(event.getAssignedUserName())
                .priority(event.getPriority())
                .reminderMinutes(event.getReminderMinutes())
                .reminderSent(event.getReminderSent())
                .status(event.getStatus())
                .sourceType(event.getSourceType())
                .sourceId(event.getSourceId())
                .notes(event.getNotes())
                .createdAt(event.getCreatedAt())
                .updatedAt(event.getUpdatedAt())
                .build();
    }

    private LocalDateTime parseDateTime(String val, boolean startOfDay) {
        try {
            if (val.contains("T")) {
                return LocalDateTime.parse(val);
            } else {
                LocalDate date = LocalDate.parse(val);
                return startOfDay ? date.atStartOfDay() : date.atTime(LocalTime.MAX);
            }
        } catch (Exception e) {
            return startOfDay ? LocalDate.now().atStartOfDay() : LocalDate.now().atTime(LocalTime.MAX);
        }
    }

    private LocalTime parseTimeOrDefault(String timeStr, LocalTime defaultTime) {
        if (timeStr == null || timeStr.trim().isEmpty()) return defaultTime;
        try {
            return LocalTime.parse(timeStr.trim());
        } catch (Exception e) {
            return defaultTime;
        }
    }
}
