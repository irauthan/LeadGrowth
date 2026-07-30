package com.leadgrowth.controller;

import com.leadgrowth.dto.PriorityDto;
import com.leadgrowth.dto.PriorityStatsDto;
import com.leadgrowth.service.PriorityService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/priority")
@CrossOrigin(origins = "*")
public class PriorityController {

    private final PriorityService priorityService;

    public PriorityController(PriorityService priorityService) {
        this.priorityService = priorityService;
    }

    @GetMapping("/leads")
    public ResponseEntity<List<PriorityDto>> getPrioritizedLeads(@AuthenticationPrincipal UserDetails userDetails) {
        List<PriorityDto> leads = priorityService.getPrioritizedLeadsForUser(userDetails.getUsername());
        return ResponseEntity.ok(leads);
    }

    @GetMapping("/stats")
    public ResponseEntity<PriorityStatsDto> getPriorityStats(@AuthenticationPrincipal UserDetails userDetails) {
        PriorityStatsDto stats = priorityService.getPriorityStatsForUser(userDetails.getUsername());
        return ResponseEntity.ok(stats);
    }
}
