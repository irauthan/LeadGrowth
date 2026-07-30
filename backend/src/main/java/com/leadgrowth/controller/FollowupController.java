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

        return ResponseEntity.ok(followupService.createFollowup(leadId, email, scheduledAt, type, notes, outcome, nextFollowupDate, remarks));
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<Map<String, Object>> completeFollowup(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> payload) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        String notes = (payload != null && payload.get("notes") != null) ? String.valueOf(payload.get("notes")) : "";
        return ResponseEntity.ok(followupService.completeFollowup(id, email, notes));
    }
}
