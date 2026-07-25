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

    @PostMapping
    public ResponseEntity<Map<String, Object>> createFollowup(@RequestBody Map<String, String> payload) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Long leadId = Long.parseLong(payload.get("leadId"));
        String scheduledAt = payload.get("scheduledAt");
        String type = payload.getOrDefault("type", "CALL");
        String notes = payload.getOrDefault("notes", "");

        return ResponseEntity.ok(followupService.createFollowup(leadId, email, scheduledAt, type, notes));
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<Map<String, Object>> completeFollowup(@PathVariable Long id, @RequestBody(required = false) Map<String, String> payload) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        String notes = payload != null ? payload.get("notes") : "";
        return ResponseEntity.ok(followupService.completeFollowup(id, email, notes));
    }
}
