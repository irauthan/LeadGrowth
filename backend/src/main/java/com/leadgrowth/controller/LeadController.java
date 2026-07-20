package com.leadgrowth.controller;

import com.leadgrowth.dto.LeadDto;
import com.leadgrowth.dto.LeadNoteRequest;
import com.leadgrowth.entity.LeadNote;
import com.leadgrowth.service.LeadService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/leads")
public class LeadController {

    private final LeadService leadService;

    public LeadController(LeadService leadService) {
        this.leadService = leadService;
    }

    @GetMapping
    public ResponseEntity<List<LeadDto>> getLeads() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(leadService.getLeads(email));
    }

    @PostMapping
    public ResponseEntity<LeadDto> createLead(@Valid @RequestBody LeadDto dto) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(leadService.createLead(dto, email));
    }

    @GetMapping("/{id}")
    public ResponseEntity<LeadDto> getLeadById(@PathVariable Long id) {
        return ResponseEntity.ok(leadService.getLeadById(id));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<LeadDto> updateStatus(
            @PathVariable Long id,
            @RequestParam String status
    ) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(leadService.updateStatus(id, status, email));
    }

    @PatchMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<LeadDto> assignLead(
            @PathVariable Long id,
            @RequestParam Long userId
    ) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(leadService.assignLead(id, userId, email));
    }

    @PostMapping("/{id}/notes")
    public ResponseEntity<Void> addNote(
            @PathVariable Long id,
            @Valid @RequestBody LeadNoteRequest request
    ) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        leadService.addNote(id, request, email);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/notes")
    public ResponseEntity<List<LeadNote>> getNotes(@PathVariable Long id) {
        return ResponseEntity.ok(leadService.getNotes(id));
    }

    @PostMapping("/bulk-assign")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<List<LeadDto>> bulkAssign(
            @RequestParam List<Long> leadIds,
            @RequestParam Long userId
    ) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(leadService.bulkAssignLeads(leadIds, userId, email));
    }

    @PostMapping("/bulk-random-assign")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<List<LeadDto>> bulkRandomAssign(@RequestParam List<Long> leadIds) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(leadService.bulkRandomAssignLeads(leadIds, email));
    }

    @PostMapping("/bulk-status")
    public ResponseEntity<List<LeadDto>> bulkStatus(
            @RequestParam List<Long> leadIds,
            @RequestParam String status
    ) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(leadService.bulkUpdateLeadStatus(leadIds, status, email));
    }
}
