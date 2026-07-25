package com.leadgrowth.service;

import com.leadgrowth.entity.User;
import com.leadgrowth.entity.Workspace;
import com.leadgrowth.repository.CampaignRepository;
import com.leadgrowth.repository.LeadRepository;
import com.leadgrowth.repository.UserRepository;
import com.leadgrowth.repository.WorkspaceRepository;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class BillingService {

    private final UserRepository userRepository;
    private final WorkspaceRepository workspaceRepository;
    private final LeadRepository leadRepository;
    private final CampaignRepository campaignRepository;
    private final AuditService auditService;

    public BillingService(
            UserRepository userRepository,
            WorkspaceRepository workspaceRepository,
            LeadRepository leadRepository,
            CampaignRepository campaignRepository,
            AuditService auditService
    ) {
        this.userRepository = userRepository;
        this.workspaceRepository = workspaceRepository;
        this.leadRepository = leadRepository;
        this.campaignRepository = campaignRepository;
        this.auditService = auditService;
    }

    public Map<String, Object> getBillingSummary(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Workspace ws = user.getWorkspace();

        long activeUsers = userRepository.countByWorkspaceId(ws.getId());
        long totalLeads = leadRepository.countByWorkspaceId(ws.getId());
        long totalCampaigns = campaignRepository.findByWorkspaceId(ws.getId()).size();

        Map<String, Object> map = new HashMap<>();
        map.put("workspaceId", ws.getId());
        map.put("workspaceName", ws.getName());
        map.put("subscriptionPlan", ws.getSubscriptionPlan() != null ? ws.getSubscriptionPlan() : "PROFESSIONAL");
        map.put("activeUsers", activeUsers);
        map.put("maxUsers", ws.getMaxUsers() != null ? ws.getMaxUsers() : 25);
        map.put("totalLeads", totalLeads);
        map.put("maxLeads", ws.getMaxLeads() != null ? ws.getMaxLeads() : 10000);
        map.put("totalCampaigns", totalCampaigns);
        map.put("storageUsedMb", 420);
        map.put("maxStorageMb", ws.getMaxStorageMb() != null ? ws.getMaxStorageMb() : 5000);
        map.put("billingCycle", "Monthly");
        map.put("nextBillingDate", "2026-08-01");
        return map;
    }

    public Map<String, Object> upgradePlan(String userEmail, String newPlan) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Workspace ws = user.getWorkspace();

        String plan = newPlan.toUpperCase();
        ws.setSubscriptionPlan(plan);
        if ("ENTERPRISE".equals(plan)) {
            ws.setMaxUsers(100);
            ws.setMaxLeads(100000);
            ws.setMaxStorageMb(50000);
        } else if ("PROFESSIONAL".equals(plan)) {
            ws.setMaxUsers(25);
            ws.setMaxLeads(10000);
            ws.setMaxStorageMb(5000);
        } else {
            ws.setMaxUsers(5);
            ws.setMaxLeads(1000);
            ws.setMaxStorageMb(1000);
        }

        workspaceRepository.save(ws);

        auditService.logAction(ws, user, "SUBSCRIPTION_UPGRADED", "WORKSPACE", ws.getId(),
                "Upgraded workspace subscription plan to " + plan);

        return getBillingSummary(userEmail);
    }
}
