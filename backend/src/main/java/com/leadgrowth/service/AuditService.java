package com.leadgrowth.service;

import com.leadgrowth.entity.AuditLog;
import com.leadgrowth.entity.User;
import com.leadgrowth.entity.Workspace;
import com.leadgrowth.repository.AuditLogRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public void logAction(Workspace workspace, User user, String action, String targetType, Long targetId, String description) {
        if (workspace == null) return;
        AuditLog log = new AuditLog(workspace, user, action, targetType, targetId, description, "127.0.0.1");
        auditLogRepository.save(log);
    }

    public List<AuditLog> getAuditLogsForWorkspace(Long workspaceId) {
        return auditLogRepository.findTop20ByWorkspaceIdOrderByCreatedAtDesc(workspaceId);
    }

    public List<AuditLog> getAllAuditLogsForWorkspace(Long workspaceId) {
        return auditLogRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceId);
    }
}
