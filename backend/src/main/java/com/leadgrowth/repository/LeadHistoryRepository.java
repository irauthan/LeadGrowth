package com.leadgrowth.repository;

import com.leadgrowth.entity.LeadHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LeadHistoryRepository extends JpaRepository<LeadHistory, Long> {
    List<LeadHistory> findByLeadIdOrderByTimestampDesc(Long leadId);
    void deleteByLeadId(Long leadId);
}
