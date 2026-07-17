package com.leadgrowth.repository;

import com.leadgrowth.entity.AdMetrics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface AdMetricsRepository extends JpaRepository<AdMetrics, Long> {
    List<AdMetrics> findByWorkspaceIdAndDateBetween(Long workspaceId, LocalDate startDate, LocalDate endDate);
    List<AdMetrics> findByWorkspaceIdOrderByDateDesc(Long workspaceId);
}
