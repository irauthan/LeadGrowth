package com.leadgrowth.repository;

import com.leadgrowth.entity.FollowupReminder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface FollowupRepository extends JpaRepository<FollowupReminder, Long> {
    List<FollowupReminder> findByWorkspaceIdOrderByScheduledAtAsc(Long workspaceId);
    List<FollowupReminder> findByAssignedToIdOrderByScheduledAtAsc(Long userId);
    List<FollowupReminder> findByWorkspaceIdAndStatus(Long workspaceId, String status);
    List<FollowupReminder> findByAssignedToIdAndScheduledAtBeforeAndStatus(Long userId, LocalDateTime now, String status);
    List<FollowupReminder> findByLeadIdOrderByScheduledAtDesc(Long leadId);
    
    // Check if assigned user has active follow-up scheduled at exact time slot (excluding CANCELLED and COMPLETED)
    @Query("SELECT COUNT(f) > 0 FROM FollowupReminder f WHERE f.assignedTo.id = :userId AND f.scheduledAt = :scheduledAt AND f.status IN ('UPCOMING', 'SCHEDULED', 'PENDING', 'OVERDUE', 'MISSED') AND (:excludeId IS NULL OR f.id != :excludeId)")
    boolean existsActiveSlotForUser(
        @Param("userId") Long userId, 
        @Param("scheduledAt") LocalDateTime scheduledAt, 
        @Param("excludeId") Long excludeId
    );

    // Find all active follow-ups for a user on a given date range
    @Query("SELECT f FROM FollowupReminder f WHERE f.assignedTo.id = :userId AND f.scheduledAt >= :startOfDay AND f.scheduledAt <= :endOfDay AND f.status IN ('UPCOMING', 'SCHEDULED', 'PENDING', 'OVERDUE', 'MISSED') ORDER BY f.scheduledAt ASC")
    List<FollowupReminder> findActiveUserFollowupsInRange(
        @Param("userId") Long userId, 
        @Param("startOfDay") LocalDateTime startOfDay, 
        @Param("endOfDay") LocalDateTime endOfDay
    );

    // Count missed/overdue followups for lead to trigger high-priority escalation
    @Query("SELECT COUNT(f) FROM FollowupReminder f WHERE f.lead.id = :leadId AND f.status IN ('OVERDUE', 'MISSED')")
    long countOverdueByLeadId(@Param("leadId") Long leadId);
}
