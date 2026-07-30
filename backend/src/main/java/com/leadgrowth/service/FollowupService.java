package com.leadgrowth.service;

import com.leadgrowth.entity.FollowupReminder;
import com.leadgrowth.entity.Lead;
import com.leadgrowth.entity.User;
import com.leadgrowth.repository.FollowupRepository;
import com.leadgrowth.repository.LeadRepository;
import com.leadgrowth.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class FollowupService {

    private final FollowupRepository followupRepository;
    private final LeadRepository leadRepository;
    private final UserRepository userRepository;
    private final LeadService leadService;

    public FollowupService(
            FollowupRepository followupRepository,
            LeadRepository leadRepository,
            UserRepository userRepository,
            @org.springframework.context.annotation.Lazy LeadService leadService
    ) {
        this.followupRepository = followupRepository;
        this.leadRepository = leadRepository;
        this.userRepository = userRepository;
        this.leadService = leadService;
    }

    public Map<String, Object> createFollowup(Long leadId, String userEmail, String scheduledAtStr, String type, String notes) {
        return createFollowup(leadId, userEmail, scheduledAtStr, type, notes, null, null, notes);
    }

    public Map<String, Object> createFollowup(Long leadId, String userEmail, String scheduledAtStr, String type, String notes, String outcome, String nextFollowupDateStr, String remarks) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new RuntimeException("Lead not found"));

        LocalDateTime scheduledAt = parseLocalDateTime(scheduledAtStr);
        LocalDateTime nextFollowupDate = nextFollowupDateStr != null && !nextFollowupDateStr.isBlank() ? parseLocalDateTime(nextFollowupDateStr) : null;
        User assignedUser = lead.getAssignedTo() != null ? lead.getAssignedTo() : user;

        String finalNotes = (notes != null && !notes.isBlank()) ? notes : (remarks != null ? remarks : "");

        FollowupReminder reminder = new FollowupReminder(lead, assignedUser, user.getWorkspace(), scheduledAt, type, finalNotes, outcome, nextFollowupDate, user);
        if (remarks != null && !remarks.isBlank()) {
            reminder.setRemarks(remarks);
        }
        FollowupReminder saved = followupRepository.save(reminder);

        // Transition Lead status to 'Follow-up' if currently in 'New', 'Interaction', 'Contacted', or 'First Call'
        String currentStatus = lead.getStatus();
        if (currentStatus == null || "New".equalsIgnoreCase(currentStatus) || "Interaction".equalsIgnoreCase(currentStatus) || "Contacted".equalsIgnoreCase(currentStatus) || "First Call".equalsIgnoreCase(currentStatus)) {
            lead.setStatus("Follow-up");
            lead.setLastFollowupDate(scheduledAt);
            if (leadService != null) {
                leadService.recalculateLeadProgress(lead);
            }
            leadRepository.save(lead);
        }

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

        // Auto update missed
        LocalDateTime now = LocalDateTime.now();
        for (FollowupReminder r : reminders) {
            if ("UPCOMING".equals(r.getStatus()) && r.getScheduledAt().isBefore(now)) {
                r.setStatus("MISSED");
                followupRepository.save(r);
            }
        }

        return reminders.stream().map(this::convertToMap).collect(Collectors.toList());
    }

    public List<Map<String, Object>> getTodayFollowups(String userEmail) {
        List<Map<String, Object>> all = getFollowups(userEmail);
        LocalDateTime startOfDay = LocalDateTime.now().with(java.time.LocalTime.MIN);
        LocalDateTime endOfDay = LocalDateTime.now().with(java.time.LocalTime.MAX);
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

    private Map<String, Object> convertToMap(FollowupReminder f) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", f.getId());
        map.put("leadId", f.getLead().getId());
        map.put("leadName", f.getLead().getName());
        map.put("leadEmail", f.getLead().getEmail());
        map.put("leadPhone", f.getLead().getPhone());
        map.put("assignedToId", f.getAssignedTo().getId());
        map.put("assignedToName", f.getAssignedTo().getFullName());
        map.put("scheduledAt", f.getScheduledAt().toString());
        map.put("status", f.getStatus());
        map.put("type", f.getType());
        map.put("notes", f.getNotes());
        map.put("remarks", f.getRemarks() != null ? f.getRemarks() : f.getNotes());
        map.put("outcome", f.getOutcome());
        map.put("nextFollowupDate", f.getNextFollowupDate() != null ? f.getNextFollowupDate().toString() : null);
        map.put("createdByName", f.getCreatedBy() != null ? f.getCreatedBy().getFullName() : f.getAssignedTo().getFullName());
        map.put("completedAt", f.getCompletedAt() != null ? f.getCompletedAt().toString() : null);
        map.put("createdAt", f.getCreatedAt().toString());
        return map;
    }
}
