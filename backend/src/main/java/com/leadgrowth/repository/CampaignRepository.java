package com.leadgrowth.repository;

import com.leadgrowth.entity.Campaign;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CampaignRepository extends JpaRepository<Campaign, Long> {
    List<Campaign> findByWorkspaceId(Long workspaceId);
    List<Campaign> findByWorkspaceIdAndPlatform(Long workspaceId, String platform);
}
