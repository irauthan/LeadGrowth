package com.leadgrowth.controller;

import com.leadgrowth.service.LeadTimelineService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/leads")
public class LeadTimelineController {

    private final LeadTimelineService leadTimelineService;

    public LeadTimelineController(LeadTimelineService leadTimelineService) {
        this.leadTimelineService = leadTimelineService;
    }

    @GetMapping("/{id}/timeline")
    public ResponseEntity<List<Map<String, Object>>> getTimeline(@PathVariable Long id) {
        return ResponseEntity.ok(leadTimelineService.getLeadTimeline(id));
    }

    @PostMapping("/{id}/timeline/notes")
    public ResponseEntity<Map<String, Object>> addNote(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        String title = payload.getOrDefault("title", "Activity Note");
        String description = payload.getOrDefault("description", "");
        return ResponseEntity.ok(leadTimelineService.addNote(id, email, title, description));
    }
}
