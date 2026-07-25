package com.leadgrowth.repository;

import com.leadgrowth.entity.LeadActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LeadActivityRepository extends JpaRepository<LeadActivity, Long> {
    List<LeadActivity> findByLeadIdOrderByCreatedAtDesc(Long leadId);
    List<LeadActivity> findByWorkspaceIdOrderByCreatedAtDesc(Long workspaceId);
}
