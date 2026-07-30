package com.leadgrowth.controller;

import com.leadgrowth.dto.CallAnalyticsDto;
import com.leadgrowth.dto.CallSessionDto;
import com.leadgrowth.service.CallService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/calls")
public class CallController {

    private final CallService callService;

    public CallController(CallService callService) {
        this.callService = callService;
    }

    @PostMapping("/start")
    public ResponseEntity<CallSessionDto> startCall(@RequestBody Map<String, Object> payload) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Long leadId = Long.parseLong(String.valueOf(payload.get("leadId")));
        return ResponseEntity.ok(callService.startCall(leadId, email));
    }

    @PostMapping("/end")
    public ResponseEntity<CallSessionDto> endCall(@RequestBody(required = false) Map<String, Object> payload) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Long callId = (payload != null && payload.get("callId") != null) ? Long.parseLong(String.valueOf(payload.get("callId"))) : null;
        String notes = (payload != null && payload.get("notes") != null) ? String.valueOf(payload.get("notes")) : "";
        return ResponseEntity.ok(callService.endCall(callId, email, notes));
    }

    @GetMapping("/active")
    public ResponseEntity<CallSessionDto> getActiveCall() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(callService.getActiveCall(email));
    }

    @GetMapping("/history/{leadId}")
    public ResponseEntity<List<CallSessionDto>> getCallHistoryForLead(@PathVariable Long leadId) {
        return ResponseEntity.ok(callService.getCallHistoryForLead(leadId));
    }

    @GetMapping("/user")
    public ResponseEntity<CallAnalyticsDto> getUserCallAnalytics() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(callService.getUserCallAnalytics(email));
    }

    @GetMapping("/team")
    public ResponseEntity<CallAnalyticsDto> getTeamCallAnalytics() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(callService.getTeamCallAnalytics(email));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<CallAnalyticsDto> getDashboardCallAnalytics() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(callService.getUserCallAnalytics(email));
    }

    @GetMapping("/analytics")
    public ResponseEntity<CallAnalyticsDto> getAnalytics() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(callService.getTeamCallAnalytics(email));
    }

    @GetMapping("/reports")
    public ResponseEntity<List<CallSessionDto>> getCallReports(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate
    ) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(callService.getCallReports(email, userId, startDate, endDate));
    }
}
