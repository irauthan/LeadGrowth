package com.leadgrowth.service;

import com.leadgrowth.entity.FollowupReminder;
import com.leadgrowth.entity.Lead;
import com.leadgrowth.entity.User;
import com.leadgrowth.repository.FollowupRepository;
import com.leadgrowth.repository.LeadRepository;
import com.leadgrowth.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZonedDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class FollowupService {

    private static final LocalTime WORK_START = LocalTime.of(9, 0);
    private static final LocalTime WORK_END = LocalTime.of(19, 0); // 7:00 PM

    private final FollowupRepository followupRepository;
    private final LeadRepository leadRepository;
    private final UserRepository userRepository;
    private final LeadService leadService;
    private final CalendarService calendarService;

    public FollowupService(
            FollowupRepository followupRepository,
            LeadRepository leadRepository,
            UserRepository userRepository,
            @org.springframework.context.annotation.Lazy LeadService leadService,
            CalendarService calendarService
    ) {
        this.followupRepository = followupRepository;
        this.leadRepository = leadRepository;
        this.userRepository = userRepository;
        this.leadService = leadService;
        this.calendarService = calendarService;
    }

    /**
     * Rule 9: Check if time is within working hours (9:00 AM - 7:00 PM)
     */
    public boolean isWithinWorkingHours(LocalDateTime dateTime) {
        LocalTime time = dateTime.toLocalTime();
        return !time.isBefore(WORK_START) && !time.isAfter(WORK_END);
    }

    /**
     * Rule 3: Find next available slot respecting working hours & avoiding duplicate slots
     */
    public LocalDateTime findNextAvailableSlot(Long userId, LocalDateTime startFrom) {
        LocalDateTime candidate = startFrom != null && startFrom.isAfter(LocalDateTime.now()) ? startFrom : LocalDateTime.now();

        // Round to next 30-minute interval
        int minute = candidate.getMinute();
        if (minute > 0 && minute < 30) {
            candidate = candidate.withMinute(30).withSecond(0).withNano(0);
        } else if (minute > 30) {
            candidate = candidate.plusHours(1).withMinute(0).withSecond(0).withNano(0);
        }

        // Ensure starts within working hours
        if (candidate.toLocalTime().isBefore(WORK_START)) {
            candidate = candidate.with(WORK_START);
        } else if (candidate.toLocalTime().isAfter(WORK_END)) {
            candidate = candidate.plusDays(1).with(WORK_START);
        }

        // Loop to find free slot
        int attempts = 0;
        while (attempts < 200) { // Limit search depth to 200 slots (~4 days)
            if (isWithinWorkingHours(candidate)) {
                boolean hasConflict = followupRepository.existsActiveSlotForUser(userId, candidate, null);
                if (!hasConflict) {
                    return candidate;
                }
            }
            // Advance by 30 mins
            candidate = candidate.plusMinutes(30);

            // If time rolls past 7:00 PM, advance to 9:00 AM next morning
            if (candidate.toLocalTime().isAfter(WORK_END)) {
                candidate = candidate.plusDays(1).with(WORK_START);
            }
        }
        return LocalDateTime.now().plusDays(1).with(WORK_START);
    }

    /**
     * Check if a time slot has conflict
     */
    public Map<String, Object> checkConflict(Long userId, String scheduledAtStr, Long excludeId) {
        LocalDateTime scheduledAt = parseLocalDateTime(scheduledAtStr);
        boolean hasConflict = followupRepository.existsActiveSlotForUser(userId, scheduledAt, excludeId);
        boolean isWorkingHours = isWithinWorkingHours(scheduledAt);
        LocalDateTime suggestedSlot = hasConflict || !isWorkingHours ? findNextAvailableSlot(userId, scheduledAt) : null;

        Map<String, Object> response = new HashMap<>();
        response.put("hasConflict", hasConflict);
        response.put("isWithinWorkingHours", isWorkingHours);
        response.put("scheduledAt", scheduledAt.toString());
        if (hasConflict) {
            response.put("message", "This time slot is already occupied. Please reschedule or use Auto Schedule.");
        } else if (!isWorkingHours) {
            response.put("message", "Scheduling is only allowed during working hours (9:00 AM – 7:00 PM).");
        }
        if (suggestedSlot != null) {
            response.put("suggestedSlot", suggestedSlot.toString());
        }
        return response;
    }

    /**
     * Rule 1 & 4: Schedule Follow-up with full validation
     */
    @Transactional
    public Map<String, Object> createFollowup(Long leadId, String userEmail, String scheduledAtStr, String type, String notes, String outcome, String nextFollowupDateStr, String remarks, Boolean autoScheduleIfConflict) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new RuntimeException("Lead not found"));

        User assignedUser = lead.getAssignedTo() != null ? lead.getAssignedTo() : user;
        LocalDateTime scheduledAt = parseLocalDateTime(scheduledAtStr);

        // Rule 6: Future Time Only
        if (scheduledAt.isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Follow-up can only be scheduled for a future time.");
        }

        // Rule 9: Working Hours Validation
        if (!isWithinWorkingHours(scheduledAt)) {
            LocalDateTime suggested = findNextAvailableSlot(assignedUser.getId(), scheduledAt);
            throw new IllegalArgumentException("Scheduling is only allowed during working hours (9:00 AM – 7:00 PM). Suggested slot: " + suggested);
        }

        // Rule 2: Conflict Check
        boolean hasConflict = followupRepository.existsActiveSlotForUser(assignedUser.getId(), scheduledAt, null);
        if (hasConflict) {
            if (Boolean.TRUE.equals(autoScheduleIfConflict)) {
                scheduledAt = findNextAvailableSlot(assignedUser.getId(), scheduledAt);
            } else {
                LocalDateTime suggested = findNextAvailableSlot(assignedUser.getId(), scheduledAt);
                Map<String, Object> errPayload = new HashMap<>();
                errPayload.put("error", "SLOT_CONFLICT");
                errPayload.put("message", "This time slot is already occupied. Please reschedule or use Auto Schedule.");
                errPayload.put("suggestedSlot", suggested.toString());
                throw new IllegalStateException("This time slot is already occupied. Suggested slot: " + suggested);
            }
        }

        LocalDateTime nextFollowupDate = nextFollowupDateStr != null && !nextFollowupDateStr.isBlank() ? parseLocalDateTime(nextFollowupDateStr) : null;
        String finalNotes = (notes != null && !notes.isBlank()) ? notes : (remarks != null ? remarks : "");

        FollowupReminder reminder = new FollowupReminder(lead, assignedUser, user.getWorkspace(), scheduledAt, type, finalNotes, outcome, nextFollowupDate, user);
        if (remarks != null && !remarks.isBlank()) {
            reminder.setRemarks(remarks);
        }
        FollowupReminder saved = followupRepository.save(reminder);

        // Auto Sync with Calendar
        if (calendarService != null) {
            calendarService.syncFollowupToCalendar(saved);
        }

        // Lead stage update & recalculated metrics
        if (lead.getLastFollowupDate() == null || scheduledAt.isAfter(lead.getLastFollowupDate())) {
            lead.setLastFollowupDate(scheduledAt);
            if (leadService != null) {
                leadService.recalculateLeadProgress(lead);
            }
            leadRepository.save(lead);
        }

        return convertToMap(saved);
    }

    public Map<String, Object> createFollowup(Long leadId, String userEmail, String scheduledAtStr, String type, String notes) {
        return createFollowup(leadId, userEmail, scheduledAtStr, type, notes, null, null, notes, false);
    }

    /**
     * Rule 6 & 11: Reschedule Follow-up (Forward-only & Future Time only)
     */
    @Transactional
    public Map<String, Object> rescheduleFollowup(Long followupId, String userEmail, String newScheduledAtStr, Boolean autoScheduleIfConflict) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        FollowupReminder reminder = followupRepository.findById(followupId)
                .orElseThrow(() -> new RuntimeException("Follow-up not found"));

        LocalDateTime oldScheduledAt = reminder.getScheduledAt();
        LocalDateTime newScheduledAt = parseLocalDateTime(newScheduledAtStr);
        LocalDateTime now = LocalDateTime.now();

        // Rule 6 & 11: Future Time Only
        if (newScheduledAt.isBefore(now)) {
            throw new IllegalArgumentException("Follow-up can only be rescheduled to a future time.");
        }

        // Rule 6 & 11: Forward-Only Rescheduling (Cannot reschedule to a time before original schedule)
        if (oldScheduledAt != null && newScheduledAt.isBefore(oldScheduledAt)) {
            throw new IllegalArgumentException("Follow-up can only be rescheduled to a future time (Backward rescheduling not allowed).");
        }

        // Rule 9: Working Hours Validation
        if (!isWithinWorkingHours(newScheduledAt)) {
            LocalDateTime suggested = findNextAvailableSlot(reminder.getAssignedTo().getId(), newScheduledAt);
            throw new IllegalArgumentException("Scheduling is only allowed during working hours (9:00 AM – 7:00 PM). Suggested slot: " + suggested);
        }

        // Rule 2: Conflict Check
        boolean hasConflict = followupRepository.existsActiveSlotForUser(reminder.getAssignedTo().getId(), newScheduledAt, reminder.getId());
        if (hasConflict) {
            if (Boolean.TRUE.equals(autoScheduleIfConflict)) {
                newScheduledAt = findNextAvailableSlot(reminder.getAssignedTo().getId(), newScheduledAt);
            } else {
                LocalDateTime suggested = findNextAvailableSlot(reminder.getAssignedTo().getId(), newScheduledAt);
                throw new IllegalStateException("This time slot is already occupied. Please reschedule or use Auto Schedule. Suggested slot: " + suggested);
            }
        }

        reminder.setScheduledAt(newScheduledAt);
        reminder.setStatus("UPCOMING");
        FollowupReminder saved = followupRepository.save(reminder);

        if (calendarService != null) {
            calendarService.syncFollowupToCalendar(saved);
        }

        return convertToMap(saved);
    }

    /**
     * Rule 3: Auto Schedule Single Lead
     */
    @Transactional
    public Map<String, Object> autoScheduleFollowup(Long leadId, String userEmail, String type, String notes) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new RuntimeException("Lead not found"));

        User assignedUser = lead.getAssignedTo() != null ? lead.getAssignedTo() : user;
        LocalDateTime freeSlot = findNextAvailableSlot(assignedUser.getId(), LocalDateTime.now());

        return createFollowup(leadId, userEmail, freeSlot.toString(), type != null ? type : "CALL", notes != null ? notes : "Auto-scheduled follow-up", null, null, null, false);
    }

    /**
     * Scenario 8: Bulk Auto Schedule
     */
    @Transactional
    public List<Map<String, Object>> bulkAutoSchedule(String userEmail, List<Long> leadIds) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Map<String, Object>> results = new ArrayList<>();
        LocalDateTime searchStart = LocalDateTime.now();

        for (Long leadId : leadIds) {
            Lead lead = leadRepository.findById(leadId).orElse(null);
            if (lead == null) continue;

            User assignedUser = lead.getAssignedTo() != null ? lead.getAssignedTo() : user;
            LocalDateTime freeSlot = findNextAvailableSlot(assignedUser.getId(), searchStart);

            Map<String, Object> scheduled = createFollowup(leadId, userEmail, freeSlot.toString(), "CALL", "Bulk auto-scheduled follow-up", null, null, null, false);
            results.add(scheduled);

            // Advance search cursor to avoid assigning identical slot to next lead in bulk loop
            searchStart = freeSlot.plusMinutes(30);
        }
        return results;
    }

    /**
     * Scenario 6: Cancel Follow-up (frees slot for recycling)
     */
    @Transactional
    public Map<String, Object> cancelFollowup(Long followupId, String userEmail, String reason) {
        FollowupReminder reminder = followupRepository.findById(followupId)
                .orElseThrow(() -> new RuntimeException("Follow-up not found"));

        reminder.setStatus("CANCELLED");
        if (reason != null && !reason.isBlank()) {
            reminder.setRemarks("Cancelled: " + reason);
        }
        FollowupReminder saved = followupRepository.save(reminder);
        return convertToMap(saved);
    }

    /**
     * Scenario 7: Reassign User & Schedule
     */
    @Transactional
    public Map<String, Object> reassignFollowup(Long followupId, Long newUserId, String newScheduledAtStr) {
        FollowupReminder reminder = followupRepository.findById(followupId)
                .orElseThrow(() -> new RuntimeException("Follow-up not found"));
        User newUser = userRepository.findById(newUserId)
                .orElseThrow(() -> new RuntimeException("Target user not found"));

        reminder.setAssignedTo(newUser);
        if (newScheduledAtStr != null && !newScheduledAtStr.isBlank()) {
            LocalDateTime newTime = parseLocalDateTime(newScheduledAtStr);
            if (isWithinWorkingHours(newTime) && !newTime.isBefore(LocalDateTime.now())) {
                reminder.setScheduledAt(newTime);
            }
        }
        FollowupReminder saved = followupRepository.save(reminder);
        return convertToMap(saved);
    }

    public List<Map<String, Object>> getFollowups(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        boolean isAdminOrManager = user.getRoles().stream()
                .anyMatch(r -> r.getName().equals("ROLE_ADMIN") || r.getName().equals("ROLE_MANAGER"));

        List<FollowupReminder> workspaceReminders = followupRepository.findByWorkspaceIdOrderByScheduledAtAsc(user.getWorkspace().getId());
        List<FollowupReminder> reminders;
        if (isAdminOrManager) {
            reminders = workspaceReminders;
        } else {
            reminders = workspaceReminders.stream()
                    .filter(r -> (r.getAssignedTo() != null && user.getId().equals(r.getAssignedTo().getId())) ||
                                 (r.getLead() != null && user.getId().equals(r.getLead().getAssignedToId())))
                    .collect(Collectors.toList());
        }

        // Rule 5 & Scenario 10: Auto update overdue/missed and check High Priority escalation
        LocalDateTime now = LocalDateTime.now();
        for (FollowupReminder r : reminders) {
            if (("UPCOMING".equals(r.getStatus()) || "PENDING".equals(r.getStatus())) && r.getScheduledAt().isBefore(now)) {
                r.setStatus("OVERDUE");
                followupRepository.save(r);

                // Scenario 10: Multiple missed follow-ups escalate lead to HIGH priority
                if (r.getLead() != null) {
                    long overdueCount = followupRepository.countOverdueByLeadId(r.getLead().getId());
                    if (overdueCount >= 2 && !"High".equalsIgnoreCase(r.getLead().getPriority())) {
                        r.getLead().setPriority("High");
                        leadRepository.save(r.getLead());
                    }
                }
            }
        }

        return reminders.stream().map(this::convertToMap).collect(Collectors.toList());
    }

    public List<Map<String, Object>> getTodayFollowups(String userEmail) {
        List<Map<String, Object>> all = getFollowups(userEmail);
        LocalDateTime startOfDay = LocalDateTime.now().with(LocalTime.MIN);
        LocalDateTime endOfDay = LocalDateTime.now().with(LocalTime.MAX);
        return all.stream()
                .filter(f -> {
                    Object scheduledObj = f.get("scheduledAt");
                    if (scheduledObj == null) return false;
                    try {
                        LocalDateTime sched = parseLocalDateTime(String.valueOf(scheduledObj));
                        return !sched.isBefore(startOfDay) && !sched.isAfter(endOfDay);
                    } catch (Exception e) {
                        return false;
                    }
                })
                .collect(Collectors.toList());
    }

    public Map<String, Object> completeFollowup(Long followupId, String userEmail, String notes) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        FollowupReminder reminder = followupRepository.findById(followupId)
                .orElseThrow(() -> new RuntimeException("Follow-up not found"));

        reminder.setStatus("COMPLETED");
        reminder.setCompletedAt(LocalDateTime.now());
        if (notes != null && !notes.trim().isEmpty()) {
            reminder.setNotes((reminder.getNotes() != null ? reminder.getNotes() + "\n" : "") + "Completed notes: " + notes);
        }

        FollowupReminder saved = followupRepository.save(reminder);
        return convertToMap(saved);
    }

    private LocalDateTime parseLocalDateTime(String dateStr) {
        if (dateStr == null || dateStr.trim().isEmpty()) {
            return LocalDateTime.now().plusDays(1);
        }
        try {
            return ZonedDateTime.parse(dateStr).toLocalDateTime();
        } catch (Exception e1) {
            try {
                return LocalDateTime.parse(dateStr);
            } catch (Exception e2) {
                try {
                    String cleaned = dateStr.replace("Z", "");
                    if (cleaned.contains(".")) {
                        cleaned = cleaned.substring(0, cleaned.indexOf("."));
                    }
                    return LocalDateTime.parse(cleaned);
                } catch (Exception e3) {
                    return LocalDateTime.now().plusDays(1);
                }
            }
        }
    }

    private Map<String, Object> convertToMap(FollowupReminder f) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", f.getId());
        map.put("leadId", f.getLead() != null ? f.getLead().getId() : null);
        map.put("leadName", f.getLead() != null ? f.getLead().getName() : "N/A");
        map.put("leadEmail", f.getLead() != null ? f.getLead().getEmail() : "");
        map.put("leadPhone", f.getLead() != null ? f.getLead().getPhone() : "");
        map.put("leadStage", f.getLead() != null ? f.getLead().getStatus() : "New Lead");
        map.put("leadPriority", f.getLead() != null ? f.getLead().getPriority() : "Medium");
        map.put("assignedToId", f.getAssignedTo() != null ? f.getAssignedTo().getId() : null);
        map.put("assignedToName", f.getAssignedTo() != null ? f.getAssignedTo().getFullName() : "Unassigned");
        map.put("scheduledAt", f.getScheduledAt() != null ? f.getScheduledAt().toString() : "");
        map.put("status", f.getStatus());
        map.put("type", f.getType());
        map.put("notes", f.getNotes());
        map.put("remarks", f.getRemarks() != null ? f.getRemarks() : f.getNotes());
        map.put("outcome", f.getOutcome());
        map.put("isOverdue", "OVERDUE".equals(f.getStatus()) || "MISSED".equals(f.getStatus()));
        map.put("nextFollowupDate", f.getNextFollowupDate() != null ? f.getNextFollowupDate().toString() : null);
        map.put("createdByName", f.getCreatedBy() != null ? f.getCreatedBy().getFullName() : (f.getAssignedTo() != null ? f.getAssignedTo().getFullName() : ""));
        map.put("completedAt", f.getCompletedAt() != null ? f.getCompletedAt().toString() : null);
        map.put("createdAt", f.getCreatedAt() != null ? f.getCreatedAt().toString() : "");
        return map;
    }
}
