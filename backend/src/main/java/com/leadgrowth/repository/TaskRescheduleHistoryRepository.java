package com.leadgrowth.repository;

import com.leadgrowth.entity.TaskRescheduleHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskRescheduleHistoryRepository extends JpaRepository<TaskRescheduleHistory, Long> {

    List<TaskRescheduleHistory> findByTaskIdOrderByCreatedAtDesc(Long taskId);

    List<TaskRescheduleHistory> findByWorkspaceIdOrderByCreatedAtDesc(Long workspaceId);
}
