package com.leadgrowth.controller;

import com.leadgrowth.entity.AuditLog;
import com.leadgrowth.entity.User;
import com.leadgrowth.repository.UserRepository;
import com.leadgrowth.service.AuditService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/audit-logs")
@PreAuthorize("hasRole('ADMIN')")
public class AuditLogController {

    private final AuditService auditService;
    private final UserRepository userRepository;

    public AuditLogController(AuditService auditService, UserRepository userRepository) {
        this.auditService = auditService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAuditLogs() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<AuditLog> logs = auditService.getAllAuditLogsForWorkspace(currentUser.getWorkspace().getId());

        List<Map<String, Object>> response = logs.stream().map(log -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", log.getId());
            map.put("action", log.getAction());
            map.put("targetType", log.getTargetType());
            map.put("targetId", log.getTargetId());
            map.put("description", log.getDescription());
            map.put("userName", log.getUser() != null ? log.getUser().getFullName() : "System");
            map.put("userEmail", log.getUser() != null ? log.getUser().getEmail() : "System");
            map.put("ipAddress", log.getIpAddress());
            map.put("createdAt", log.getCreatedAt().toString());
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }
}
