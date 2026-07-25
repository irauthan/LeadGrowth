package com.leadgrowth.service;

import com.leadgrowth.entity.Campaign;
import com.leadgrowth.entity.User;
import com.leadgrowth.repository.CampaignRepository;
import com.leadgrowth.repository.UserRepository;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CampaignService {

    private final CampaignRepository campaignRepository;
    private final UserRepository userRepository;

    public CampaignService(CampaignRepository campaignRepository, UserRepository userRepository) {
        this.campaignRepository = campaignRepository;
        this.userRepository = userRepository;
    }

    public List<Campaign> getCampaigns(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        if (user.getWorkspace() == null) {
            throw new IllegalStateException("User does not belong to a workspace");
        }
        return campaignRepository.findByWorkspaceId(user.getWorkspace().getId());
    }

    public List<java.util.Map<String, Object>> getUserCampaigns(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        Long workspaceId = user.getWorkspace().getId();
        List<Campaign> list = campaignRepository.findByWorkspaceId(workspaceId);

        return list.stream().map(c -> {
            java.util.Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", c.getId());
            map.put("name", c.getName());
            map.put("platform", c.getPlatform());
            map.put("status", c.getStatus());
            map.put("clicks", c.getClicks());
            map.put("impressions", c.getImpressions());
            double ctr = c.getImpressions() > 0 ? (c.getClicks() * 100.0 / c.getImpressions()) : 0.0;
            map.put("ctr", Math.round(ctr * 100.0) / 100.0);
            map.put("cpc", 1.45);
            map.put("leadsCount", c.getLeadsCount());
            map.put("conversions", c.getConversions());
            map.put("personalRevenue", c.getConversions() * 2500.0);
            return map;
        }).collect(java.util.stream.Collectors.toList());
    }

    @Transactional
    public Campaign createCampaign(Campaign campaign, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        if (user.getWorkspace() == null) {
            throw new IllegalStateException("User does not belong to a workspace");
        }
        campaign.setWorkspace(user.getWorkspace());
        return campaignRepository.save(campaign);
    }
}
