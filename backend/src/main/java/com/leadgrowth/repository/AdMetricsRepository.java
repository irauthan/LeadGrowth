package com.leadgrowth.repository;

import com.leadgrowth.entity.AdMetrics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface AdMetricsRepository extends JpaRepository<AdMetrics, Long> {
    List<AdMetrics> findByWorkspaceIdAndDateBetween(Long workspaceId, LocalDate startDate, LocalDate endDate);
    List<AdMetrics> findByWorkspaceIdOrderByDateDesc(Long workspaceId);

    @Modifying
    @Query("DELETE FROM AdMetrics am WHERE am.workspace.id = :workspaceId")
    void deleteByWorkspaceId(@Param("workspaceId") Long workspaceId);
}
