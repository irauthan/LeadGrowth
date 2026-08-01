package com.leadgrowth.controller;

import com.leadgrowth.service.ManagerAnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/manager")
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
public class ManagerAnalyticsController {

    private final ManagerAnalyticsService managerAnalyticsService;

    public ManagerAnalyticsController(ManagerAnalyticsService managerAnalyticsService) {
        this.managerAnalyticsService = managerAnalyticsService;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboardData(
            @org.springframework.web.bind.annotation.RequestParam(required = false) String period,
            @org.springframework.web.bind.annotation.RequestParam(required = false) String startDate,
            @org.springframework.web.bind.annotation.RequestParam(required = false) String endDate
    ) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(managerAnalyticsService.getManagerDashboardData(email, period, startDate, endDate));
    }

    @GetMapping("/analytics")
    public ResponseEntity<Map<String, Object>> getAnalyticsData(
            @org.springframework.web.bind.annotation.RequestParam(required = false) String period,
            @org.springframework.web.bind.annotation.RequestParam(required = false) String startDate,
            @org.springframework.web.bind.annotation.RequestParam(required = false) String endDate
    ) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(managerAnalyticsService.getManagerAnalytics(email, period, startDate, endDate));
    }
}
