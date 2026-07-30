package com.leadgrowth.controller;

import com.leadgrowth.dto.AddActivityLogRequest;
import com.leadgrowth.dto.CompleteStepRequest;
import com.leadgrowth.dto.ContactRepoDto;
import com.leadgrowth.dto.LeadDto;
import com.leadgrowth.dto.LeadNoteRequest;
import com.leadgrowth.dto.SalesActivityLogDto;
import com.leadgrowth.entity.LeadNote;
import com.leadgrowth.service.LeadService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/leads")
public class LeadController {

    private final LeadService leadService;

    public LeadController(LeadService leadService) {
        this.leadService = leadService;
    }

    @GetMapping("/contacts")
    public ResponseEntity<List<ContactRepoDto>> getContactsRepository() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(leadService.getContactsRepository(email));
    }

    @GetMapping
    public ResponseEntity<List<LeadDto>> getLeads() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(leadService.getLeads(email));
    }

    @GetMapping("/high-priority")
    public ResponseEntity<List<LeadDto>> getHighPriorityLeads() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(leadService.getHighPriorityLeads(email));
    }

    @GetMapping("/new")
    public ResponseEntity<List<LeadDto>> getNewLeadsToday() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(leadService.getNewLeadsToday(email));
    }

    @GetMapping("/negotiation")
    public ResponseEntity<List<LeadDto>> getNegotiationLeads() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(leadService.getNegotiationLeads(email));
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
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
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

    @PostMapping("/{id}/auto-assign")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<LeadDto> autoAssignLead(@PathVariable Long id) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(leadService.assignLead(id, -1L, email));
    }

    @GetMapping("/workspace")
    public ResponseEntity<List<LeadDto>> getWorkspaceLeads() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(leadService.getLeads(email));
    }

    @PostMapping("/{id}/add-to-pipeline")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<LeadDto> addToPipeline(@PathVariable Long id) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(leadService.addToPipeline(id, email));
    }

    @GetMapping("/pipeline")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<LeadDto>> getPipelineLeads() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(leadService.getPipelineLeads(email));
    }

    @GetMapping("/pending-assigned")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<LeadDto>> getPendingAssignedLeads() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(leadService.getPendingAssignedLeads(email));
    }

    @PatchMapping("/{id}/activity")
    public ResponseEntity<LeadDto> updateActivity(
            @PathVariable Long id,
            @RequestParam String activityKey,
            @RequestParam String status,
            @RequestParam(required = false) String remarks
    ) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(leadService.updateLeadActivity(id, activityKey, status, remarks, email));
    }

    @PostMapping("/{id}/workflow-steps/{activityKey}/activities")
    public ResponseEntity<LeadDto> addStepActivityLog(
            @PathVariable Long id,
            @PathVariable String activityKey,
            @RequestBody AddActivityLogRequest request
    ) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(leadService.addStepActivityLog(id, activityKey, request, email));
    }

    @PostMapping("/{id}/workflow-steps/{activityKey}/complete")
    public ResponseEntity<LeadDto> completeWorkflowStep(
            @PathVariable Long id,
            @PathVariable String activityKey,
            @RequestBody(required = false) CompleteStepRequest request
    ) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(leadService.completeWorkflowStep(id, activityKey, request != null ? request : new CompleteStepRequest(), email));
    }

    @GetMapping("/{id}/activities-history")
    public ResponseEntity<List<SalesActivityLogDto>> getLeadActivityHistory(@PathVariable Long id) {
        return ResponseEntity.ok(leadService.getLeadActivityLogs(id));
    }

    @GetMapping("/workflow-pending-counts")
    public ResponseEntity<Map<String, Integer>> getWorkflowPendingCounts() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(leadService.getWorkflowPendingCounts(email));
    }

    @PatchMapping("/{id}/auto-save")
    public ResponseEntity<LeadDto> autoSaveWorkspaceLead(
            @PathVariable Long id,
            @RequestBody LeadDto dto
    ) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(leadService.updateLeadWorkspace(id, dto, email));
    }
}
