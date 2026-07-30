package com.leadgrowth.repository;

import com.leadgrowth.entity.CallHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CallHistoryRepository extends JpaRepository<CallHistory, Long> {

    Optional<CallHistory> findFirstByUserIdAndStatusOrderByIdDesc(Long userId, String status);

    Optional<CallHistory> findFirstByLeadIdAndStatusOrderByIdDesc(Long leadId, String status);

    List<CallHistory> findByLeadIdOrderByStartTimeDesc(Long leadId);

    List<CallHistory> findByUserIdAndStartTimeBetweenOrderByStartTimeDesc(Long userId, LocalDateTime start, LocalDateTime end);

    List<CallHistory> findByWorkspaceIdAndStartTimeBetweenOrderByStartTimeDesc(Long workspaceId, LocalDateTime start, LocalDateTime end);

    List<CallHistory> findByWorkspaceIdOrderByStartTimeDesc(Long workspaceId);

    @Query("SELECT COALESCE(SUM(c.durationSeconds), 0) FROM CallHistory c WHERE c.user.id = :userId AND c.startTime >= :start AND c.startTime <= :end AND c.status = 'COMPLETED'")
    Long sumDurationSecondsByUserIdAndDateRange(@Param("userId") Long userId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COALESCE(SUM(c.durationSeconds), 0) FROM CallHistory c WHERE c.workspace.id = :workspaceId AND c.startTime >= :start AND c.startTime <= :end AND c.status = 'COMPLETED'")
    Long sumDurationSecondsByWorkspaceIdAndDateRange(@Param("workspaceId") Long workspaceId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
