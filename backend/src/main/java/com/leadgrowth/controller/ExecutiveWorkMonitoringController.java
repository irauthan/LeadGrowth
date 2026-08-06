package com.leadgrowth.controller;

import com.leadgrowth.dto.ExecutiveWorkSummaryDto;
import com.leadgrowth.service.ExecutiveWorkMonitoringService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/executive-work")
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
public class ExecutiveWorkMonitoringController {

    private final ExecutiveWorkMonitoringService executiveWorkMonitoringService;

    public ExecutiveWorkMonitoringController(ExecutiveWorkMonitoringService executiveWorkMonitoringService) {
        this.executiveWorkMonitoringService = executiveWorkMonitoringService;
    }

    @GetMapping
    public ResponseEntity<ExecutiveWorkSummaryDto> getExecutiveWork(
            @RequestParam(required = false) Long userId,
            @RequestParam(defaultValue = "THIS_MONTH") String timeframe,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate
    ) {
        String actorEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        ExecutiveWorkSummaryDto summary = executiveWorkMonitoringService.getExecutiveWorkSummary(
                actorEmail, userId, timeframe, startDate, endDate
        );
        return ResponseEntity.ok(summary);
    }
}
