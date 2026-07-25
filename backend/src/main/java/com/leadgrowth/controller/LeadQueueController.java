package com.leadgrowth.controller;

import com.leadgrowth.dto.LeadDto;
import com.leadgrowth.entity.User;
import com.leadgrowth.repository.UserRepository;
import com.leadgrowth.service.LeadQueueService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/leads/queue")
public class LeadQueueController {

    private final LeadQueueService leadQueueService;
    private final UserRepository userRepository;

    public LeadQueueController(LeadQueueService leadQueueService, UserRepository userRepository) {
        this.leadQueueService = leadQueueService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<List<LeadDto>> getQueue() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(leadQueueService.getUnassignedLeadQueue(user.getWorkspace().getId()));
    }

    @PostMapping("/bulk-assign")
    public ResponseEntity<List<LeadDto>> bulkAssignLeads(
            @RequestBody java.util.Map<String, Object> payload
    ) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        List<Integer> idsRaw = (List<Integer>) payload.get("leadIds");
        List<Long> leadIds = idsRaw.stream().map(Long::valueOf).collect(java.util.stream.Collectors.toList());
        Long targetUserId = Long.valueOf(payload.get("targetUserId").toString());
        return ResponseEntity.ok(leadQueueService.bulkAssignLeads(leadIds, targetUserId, email));
    }

    @PostMapping("/{id}/auto-assign")
    public ResponseEntity<LeadDto> autoAssignLead(@PathVariable Long id) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(leadQueueService.autoAssignLead(id, email));
    }

    @PostMapping("/idle-sweep")
    public ResponseEntity<LeadDto> triggerIdleSweep() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        LeadDto assignedLead = leadQueueService.triggerIdlePreventionSweep(email);
        if (assignedLead != null) {
            return ResponseEntity.ok(assignedLead);
        } else {
            return ResponseEntity.noContent().build();
        }
    }
}
