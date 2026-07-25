package com.leadgrowth.controller;

import com.leadgrowth.service.SecurityCenterService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/security")
@PreAuthorize("hasRole('ADMIN')")
public class SecurityCenterController {

    private final SecurityCenterService securityCenterService;

    public SecurityCenterController(SecurityCenterService securityCenterService) {
        this.securityCenterService = securityCenterService;
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSecuritySummary() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(securityCenterService.getSecuritySummary(email));
    }
}
