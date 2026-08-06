package com.leadgrowth.repository;

import com.leadgrowth.entity.SalesActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SalesActivityLogRepository extends JpaRepository<SalesActivityLog, Long> {
    List<SalesActivityLog> findBySalesActivityIdOrderByActivityNumberAsc(Long salesActivityId);
    List<SalesActivityLog> findBySalesActivityIdOrderByActivityNumberDesc(Long salesActivityId);
    List<SalesActivityLog> findByLeadIdOrderByCreatedAtDesc(Long leadId);
    List<SalesActivityLog> findByLeadIdOrderByCreatedAtAsc(Long leadId);
    List<SalesActivityLog> findByLoggedByIdAndCreatedAtBetweenOrderByCreatedAtDesc(Long loggedById, java.time.LocalDateTime start, java.time.LocalDateTime end);
    List<SalesActivityLog> findByCreatedAtBetweenOrderByCreatedAtDesc(java.time.LocalDateTime start, java.time.LocalDateTime end);
}
