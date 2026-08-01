package com.leadgrowth.repository;

import com.leadgrowth.entity.CalendarEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CalendarEventRepository extends JpaRepository<CalendarEvent, Long> {

    List<CalendarEvent> findByWorkspaceIdOrderByStartTimeAsc(Long workspaceId);

    @Query("SELECT e FROM CalendarEvent e WHERE e.workspace.id = :workspaceId AND e.startTime <= :end AND e.endTime >= :start ORDER BY e.startTime ASC")
    List<CalendarEvent> findByWorkspaceIdAndDateRange(
            @Param("workspaceId") Long workspaceId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    List<CalendarEvent> findByWorkspaceIdAndSourceTypeAndSourceId(Long workspaceId, String sourceType, Long sourceId);

    @Query("SELECT e FROM CalendarEvent e WHERE e.reminderSent = false AND e.reminderMinutes IS NOT NULL AND e.startTime <= :targetTime AND e.status = 'PENDING'")
    List<CalendarEvent> findUpcomingEventsNeedingReminder(@Param("targetTime") LocalDateTime targetTime);
}
