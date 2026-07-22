package com.leadgrowth.repository;

import com.leadgrowth.entity.AssignmentLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AssignmentLogRepository extends JpaRepository<AssignmentLog, Long> {
    List<AssignmentLog> findByWorkspaceIdOrderByAssignedAtDesc(Long workspaceId);

    @Modifying
    @Query("DELETE FROM AssignmentLog al WHERE al.workspace.id = :workspaceId")
    void deleteByWorkspaceId(@Param("workspaceId") Long workspaceId);
}
