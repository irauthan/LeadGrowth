package com.leadgrowth.repository;

import com.leadgrowth.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByWorkspaceIdOrderByCreatedAtDesc(Long workspaceId);
    List<Task> findByWorkspaceIdAndAssignedToIdOrderByCreatedAtDesc(Long workspaceId, Long userId);
}
