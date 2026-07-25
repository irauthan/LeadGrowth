package com.leadgrowth.controller;

import com.leadgrowth.service.BillingService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/billing")
public class BillingController {

    private final BillingService billingService;

    public BillingController(BillingService billingService) {
        this.billingService = billingService;
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummary() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(billingService.getBillingSummary(email));
    }

    @PostMapping("/upgrade")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> upgradePlan(@RequestBody Map<String, String> payload) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        String newPlan = payload.getOrDefault("plan", "PROFESSIONAL");
        return ResponseEntity.ok(billingService.upgradePlan(email, newPlan));
    }
}
