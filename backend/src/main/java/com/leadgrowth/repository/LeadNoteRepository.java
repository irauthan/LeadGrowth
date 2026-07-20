package com.leadgrowth.repository;

import com.leadgrowth.entity.LeadNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface LeadNoteRepository extends JpaRepository<LeadNote, Long> {
    List<LeadNote> findByLeadIdOrderByCreatedAtDesc(Long leadId);

    @Modifying
    @Query("DELETE FROM LeadNote ln WHERE ln.lead.workspace.id = :workspaceId")
    void deleteByWorkspaceId(@Param("workspaceId") Long workspaceId);
}
