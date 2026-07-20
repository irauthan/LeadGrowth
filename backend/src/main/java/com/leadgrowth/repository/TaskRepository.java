package com.leadgrowth.repository;

import com.leadgrowth.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByWorkspaceIdOrderByCreatedAtDesc(Long workspaceId);
    List<Task> findByWorkspaceIdAndAssignedToIdOrderByCreatedAtDesc(Long workspaceId, Long userId);
    
    long countByAssignedToAndStatusIn(com.leadgrowth.entity.User user, List<String> statuses);

    @Modifying
    @Query("DELETE FROM Task t WHERE t.workspace.id = :workspaceId")
    void deleteByWorkspaceId(@Param("workspaceId") Long workspaceId);
}
