package com.leadgrowth.repository;

import com.leadgrowth.entity.Campaign;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CampaignRepository extends JpaRepository<Campaign, Long> {
    List<Campaign> findByWorkspaceId(Long workspaceId);
    List<Campaign> findByWorkspaceIdAndPlatform(Long workspaceId, String platform);

    @Modifying
    @Query("DELETE FROM Campaign c WHERE c.workspace.id = :workspaceId")
    void deleteByWorkspaceId(@Param("workspaceId") Long workspaceId);
}
