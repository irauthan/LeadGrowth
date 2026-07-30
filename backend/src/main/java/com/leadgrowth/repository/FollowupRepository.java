package com.leadgrowth.repository;

import com.leadgrowth.entity.FollowupReminder;
import org.springframework.data.jpa.repository.JpaRepository;
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
}
