package com.leadgrowth.service;

import com.leadgrowth.entity.FollowupReminder;
import com.leadgrowth.entity.Lead;
import com.leadgrowth.entity.User;
import com.leadgrowth.repository.FollowupRepository;
import com.leadgrowth.repository.LeadRepository;
import com.leadgrowth.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class FollowupService {

    private final FollowupRepository followupRepository;
    private final LeadRepository leadRepository;
    private final UserRepository userRepository;

    public FollowupService(FollowupRepository followupRepository, LeadRepository leadRepository, UserRepository userRepository) {
        this.followupRepository = followupRepository;
        this.leadRepository = leadRepository;
        this.userRepository = userRepository;
    }

    public Map<String, Object> createFollowup(Long leadId, String userEmail, String scheduledAtStr, String type, String notes) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new RuntimeException("Lead not found"));

        LocalDateTime scheduledAt = LocalDateTime.parse(scheduledAtStr);
        FollowupReminder reminder = new FollowupReminder(lead, user, user.getWorkspace(), scheduledAt, type, notes);
        FollowupReminder saved = followupRepository.save(reminder);

        return convertToMap(saved);
    }

    public List<Map<String, Object>> getFollowups(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        boolean isAdminOrManager = user.getRoles().stream()
                .anyMatch(r -> r.getName().equals("ROLE_ADMIN") || r.getName().equals("ROLE_MANAGER"));

        List<FollowupReminder> reminders;
        if (isAdminOrManager) {
            reminders = followupRepository.findByWorkspaceIdOrderByScheduledAtAsc(user.getWorkspace().getId());
        } else {
            reminders = followupRepository.findByAssignedToIdOrderByScheduledAtAsc(user.getId());
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
        map.put("completedAt", f.getCompletedAt() != null ? f.getCompletedAt().toString() : null);
        map.put("createdAt", f.getCreatedAt().toString());
        return map;
    }
}
