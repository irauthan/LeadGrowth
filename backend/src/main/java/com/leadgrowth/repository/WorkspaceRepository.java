package com.leadgrowth.repository;

import com.leadgrowth.entity.Workspace;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface WorkspaceRepository extends JpaRepository<Workspace, Long> {
    Optional<Workspace> findByInviteCode(String inviteCode);
    Optional<Workspace> findBySlug(String slug);
    boolean existsBySlug(String slug);
    boolean existsByInviteCode(String inviteCode);
}
