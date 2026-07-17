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
