package com.leadgrowth.repository;

import com.leadgrowth.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByWorkspaceIdOrderByCreatedAtDesc(Long workspaceId);
    List<AuditLog> findTop20ByWorkspaceIdOrderByCreatedAtDesc(Long workspaceId);
    List<AuditLog> findByWorkspaceIdAndActionContainingIgnoreCaseOrderByCreatedAtDesc(Long workspaceId, String action);
}
