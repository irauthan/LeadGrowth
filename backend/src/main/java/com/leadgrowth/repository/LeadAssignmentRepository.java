package com.leadgrowth.repository;

import com.leadgrowth.entity.LeadAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface LeadAssignmentRepository extends JpaRepository<LeadAssignment, Long> {
    List<LeadAssignment> findByUserIdOrderByAssignedAtDesc(Long userId);

    @Modifying
    @Query("DELETE FROM LeadAssignment la WHERE la.lead.workspace.id = :workspaceId")
    void deleteByWorkspaceId(@Param("workspaceId") Long workspaceId);
}
