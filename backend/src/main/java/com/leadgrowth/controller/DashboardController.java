package com.leadgrowth.controller;

import com.leadgrowth.dto.DashboardKpis;
import com.leadgrowth.dto.SearchResultDto;
import com.leadgrowth.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping
    public ResponseEntity<DashboardKpis> getDashboardData() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(dashboardService.getDashboardData(email));
    }

    @GetMapping("/search")
    public ResponseEntity<List<SearchResultDto>> searchGlobal(@RequestParam String q) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(dashboardService.searchGlobal(q, email));
    }
}
