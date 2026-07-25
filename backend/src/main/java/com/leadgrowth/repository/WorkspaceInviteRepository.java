package com.leadgrowth.repository;

import com.leadgrowth.entity.WorkspaceInvite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkspaceInviteRepository extends JpaRepository<WorkspaceInvite, Long> {
    Optional<WorkspaceInvite> findByToken(String token);
    List<WorkspaceInvite> findByWorkspaceIdOrderByCreatedAtDesc(Long workspaceId);
    Optional<WorkspaceInvite> findByWorkspaceIdAndEmailAndStatus(Long workspaceId, String email, String status);
}
