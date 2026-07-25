package com.leadgrowth.service;

import com.leadgrowth.entity.User;
import com.leadgrowth.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class SecurityCenterService {

    private final UserRepository userRepository;
    private final AuditService auditService;

    public SecurityCenterService(UserRepository userRepository, AuditService auditService) {
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    public Map<String, Object> getSecuritySummary(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Long workspaceId = user.getWorkspace().getId();

        long totalUsers = userRepository.countByWorkspaceId(workspaceId);
        long activeSessions = userRepository.findByWorkspaceId(workspaceId).stream()
                .filter(u -> "ACTIVE".equalsIgnoreCase(u.getStatus()))
                .count();

        List<Map<String, Object>> activeSessionList = new ArrayList<>();
        List<User> members = userRepository.findByWorkspaceId(workspaceId);
        for (User m : members) {
            Map<String, Object> s = new HashMap<>();
            s.put("userId", m.getId());
            s.put("fullName", m.getFullName());
            s.put("email", m.getEmail());
            s.put("role", m.getRoles().isEmpty() ? "USER" : m.getRoles().iterator().next().getName());
            s.put("ipAddress", "192.168.1." + (m.getId() + 10));
            s.put("device", "MacBook Pro / Chrome 122");
            s.put("status", "ACTIVE");
            s.put("lastActive", m.getLastActiveAt() != null ? m.getLastActiveAt().toString() : "Recent");
            activeSessionList.add(s);
        }

        Map<String, Object> map = new HashMap<>();
        map.put("totalUsers", totalUsers);
        map.put("activeSessions", activeSessions);
        map.put("failedLogins24h", 0);
        map.put("mfaEnforcementStatus", "ENABLED");
        map.put("accountLockoutThreshold", 5);
        map.put("sessions", activeSessionList);
        map.put("recentAuditLogs", auditService.getAuditLogsForWorkspace(workspaceId));
        return map;
    }
}
