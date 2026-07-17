package com.leadgrowth.repository;

import com.leadgrowth.entity.Lead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface LeadRepository extends JpaRepository<Lead, Long> {
    List<Lead> findByWorkspaceIdOrderByCreatedAtDesc(Long workspaceId);
    List<Lead> findByWorkspaceIdAndAssignedToIdOrderByCreatedAtDesc(Long workspaceId, Long userId);
    List<Lead> findByWorkspaceIdAndStatus(Long workspaceId, String status);
    long countByWorkspaceId(Long workspaceId);
    long countByWorkspaceIdAndStatus(Long workspaceId, String status);
    List<Lead> findTop100ByWorkspaceIdOrderByCreatedAtDesc(Long workspaceId);
}
