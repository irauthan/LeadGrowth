package com.leadgrowth.repository;

import com.leadgrowth.entity.SalesActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SalesActivityRepository extends JpaRepository<SalesActivity, Long> {
    List<SalesActivity> findByLeadIdOrderByIdAsc(Long leadId);
    Optional<SalesActivity> findByLeadIdAndActivityKey(Long leadId, String activityKey);
    void deleteByLeadId(Long leadId);
}
