package com.leadgrowth.controller;

import com.leadgrowth.service.FollowupService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/followups")
public class FollowupController {

    private final FollowupService followupService;

    public FollowupController(FollowupService followupService) {
        this.followupService = followupService;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getFollowups() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(followupService.getFollowups(email));
    }

    @GetMapping("/today")
    public ResponseEntity<List<Map<String, Object>>> getTodayFollowups() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(followupService.getTodayFollowups(email));
    }

    @GetMapping("/check-conflict")
    public ResponseEntity<Map<String, Object>> checkConflict(
            @RequestParam Long userId,
            @RequestParam String scheduledAt,
            @RequestParam(required = false) Long excludeId
    ) {
        return ResponseEntity.ok(followupService.checkConflict(userId, scheduledAt, excludeId));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createFollowup(@RequestBody Map<String, Object> payload) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Long leadId = Long.parseLong(String.valueOf(payload.get("leadId")));
        String scheduledAt = payload.get("scheduledAt") != null ? String.valueOf(payload.get("scheduledAt")) : String.valueOf(payload.get("nextFollowupDate"));
        String type = payload.get("type") != null ? String.valueOf(payload.get("type")) : (payload.get("communicationType") != null ? String.valueOf(payload.get("communicationType")) : "CALL");
        String notes = payload.get("notes") != null ? String.valueOf(payload.get("notes")) : "";
        String outcome = payload.get("outcome") != null ? String.valueOf(payload.get("outcome")) : null;
        String nextFollowupDate = payload.get("nextFollowupDate") != null ? String.valueOf(payload.get("nextFollowupDate")) : null;
        String remarks = payload.get("remarks") != null ? String.valueOf(payload.get("remarks")) : notes;
        Boolean autoScheduleIfConflict = payload.get("autoScheduleIfConflict") != null && Boolean.parseBoolean(String.valueOf(payload.get("autoScheduleIfConflict")));

        return ResponseEntity.ok(followupService.createFollowup(leadId, email, scheduledAt, type, notes, outcome, nextFollowupDate, remarks, autoScheduleIfConflict));
    }

    @PostMapping("/auto-schedule")
    public ResponseEntity<Map<String, Object>> autoScheduleFollowup(@RequestBody Map<String, Object> payload) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Long leadId = Long.parseLong(String.valueOf(payload.get("leadId")));
        String type = payload.get("type") != null ? String.valueOf(payload.get("type")) : "CALL";
        String notes = payload.get("notes") != null ? String.valueOf(payload.get("notes")) : "Auto-scheduled follow-up";

        return ResponseEntity.ok(followupService.autoScheduleFollowup(leadId, email, type, notes));
    }

    @PostMapping("/bulk-auto-schedule")
    public ResponseEntity<List<Map<String, Object>>> bulkAutoSchedule(@RequestBody Map<String, Object> payload) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        List<?> rawIds = (List<?>) payload.get("leadIds");
        List<Long> leadIds = rawIds.stream().map(id -> Long.parseLong(String.valueOf(id))).toList();

        return ResponseEntity.ok(followupService.bulkAutoSchedule(email, leadIds));
    }

    @PostMapping("/{id}/reschedule")
    public ResponseEntity<Map<String, Object>> rescheduleFollowup(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        String newScheduledAt = String.valueOf(payload.get("scheduledAt"));
        Boolean autoScheduleIfConflict = payload.get("autoScheduleIfConflict") != null && Boolean.parseBoolean(String.valueOf(payload.get("autoScheduleIfConflict")));

        return ResponseEntity.ok(followupService.rescheduleFollowup(id, email, newScheduledAt, autoScheduleIfConflict));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<Map<String, Object>> cancelFollowup(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> payload) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        String reason = (payload != null && payload.get("reason") != null) ? String.valueOf(payload.get("reason")) : "Cancelled by user";

        return ResponseEntity.ok(followupService.cancelFollowup(id, email, reason));
    }

    @PostMapping("/{id}/reassign")
    public ResponseEntity<Map<String, Object>> reassignFollowup(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        Long newUserId = Long.parseLong(String.valueOf(payload.get("newUserId")));
        String newScheduledAt = payload.get("scheduledAt") != null ? String.valueOf(payload.get("scheduledAt")) : null;

        return ResponseEntity.ok(followupService.reassignFollowup(id, newUserId, newScheduledAt));
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<Map<String, Object>> completeFollowup(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> payload) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        String notes = (payload != null && payload.get("notes") != null) ? String.valueOf(payload.get("notes")) : "";

        return ResponseEntity.ok(followupService.completeFollowup(id, email, notes));
    }
}
