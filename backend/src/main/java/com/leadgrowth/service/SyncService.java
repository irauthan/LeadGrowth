package com.leadgrowth.service;

import com.leadgrowth.dto.LeadDto;
import com.leadgrowth.entity.*;
import com.leadgrowth.repository.*;
import com.leadgrowth.websocket.WebSocketManager;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Random;

@Service
public class SyncService {

    private final CampaignRepository campaignRepository;
    private final LeadRepository leadRepository;
    private final UserRepository userRepository;
    private final IntegrationRepository integrationRepository;
    private final SyncLogRepository syncLogRepository;
    private final AdMetricsRepository adMetricsRepository;
    private final WebSocketManager webSocketManager;

    private final Random random = new Random();
    private final List<String> firstNames = Arrays.asList("James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth");
    private final List<String> lastNames = Arrays.asList("Smith", "Johnson", "Williams", "Brown", "Jones", "Miller", "Davis", "Garcia", "Rodriguez", "Wilson");
    private final List<String> domains = Arrays.asList("gmail.com", "outlook.com", "yahoo.com", "business.co", "agency.net");

    public SyncService(
            CampaignRepository campaignRepository,
            LeadRepository leadRepository,
            UserRepository userRepository,
            IntegrationRepository integrationRepository,
            SyncLogRepository syncLogRepository,
            AdMetricsRepository adMetricsRepository,
            WebSocketManager webSocketManager
    ) {
        this.campaignRepository = campaignRepository;
        this.leadRepository = leadRepository;
        this.userRepository = userRepository;
        this.integrationRepository = integrationRepository;
        this.syncLogRepository = syncLogRepository;
        this.adMetricsRepository = adMetricsRepository;
        this.webSocketManager = webSocketManager;
    }

    @Transactional
    public void syncWorkspace(Long workspaceId, String platform) {
        List<Integration> integrations = integrationRepository.findByWorkspaceId(workspaceId);
        
        // Find if platform is connected
        boolean isConnected = integrations.stream()
                .anyMatch(i -> i.getPlatform().equalsIgnoreCase(platform) && "Connected".equals(i.getStatus()));

        if (!isConnected) {
            saveSyncLog(workspaceId, platform, "Failed", "Integration for " + platform + " is disconnected.");
            return;
        }

        // Perform mock data sync
        List<Campaign> campaigns = campaignRepository.findByWorkspaceIdAndPlatform(workspaceId, platform);
        if (campaigns.isEmpty()) {
            saveSyncLog(workspaceId, platform, "Success", "Synced successfully. No active campaigns found for " + platform);
            return;
        }

        List<User> workspaceUsers = userRepository.findByWorkspaceId(workspaceId);
        User defaultAssignee = workspaceUsers.isEmpty() ? null : workspaceUsers.get(random.nextInt(workspaceUsers.size()));

        StringBuilder logDetails = new StringBuilder("Sync details for " + platform + ":\n");

        for (Campaign campaign : campaigns) {
            // Simulate incremental increases in metrics
            int addedImpressions = 1000 + random.nextInt(5000);
            int addedClicks = 50 + random.nextInt(250);
            BigDecimal addedSpend = new BigDecimal(50 + random.nextInt(200));
            int addedConversions = random.nextInt(5);
            BigDecimal addedRevenue = addedSpend.multiply(new BigDecimal(1.5 + random.nextDouble() * 2)); // Positive ROAS

            campaign.setImpressions(campaign.getImpressions() + addedImpressions);
            campaign.setClicks(campaign.getClicks() + addedClicks);
            campaign.setSpend(campaign.getSpend().add(addedSpend));
            campaign.setConversions(campaign.getConversions() + addedConversions);
            campaign.setRevenue(campaign.getRevenue().add(addedRevenue));

            // Randomly create a new lead for this campaign
            if (random.nextBoolean()) {
                String fName = firstNames.get(random.nextInt(firstNames.size()));
                String lName = lastNames.get(random.nextInt(lastNames.size()));
                String email = (fName + "." + lName + "@" + domains.get(random.nextInt(domains.size()))).toLowerCase();
                String phone = "+1 (555) " + (100 + random.nextInt(900)) + "-" + (1000 + random.nextInt(9000));

                Lead lead = Lead.builder()
                        .workspace(campaign.getWorkspace())
                        .campaign(campaign)
                        .name(fName + " " + lName)
                        .email(email)
                        .phone(phone)
                        .sourcePlatform(platform)
                        .campaignName(campaign.getName())
                        .status("New")
                        .assignedTo(defaultAssignee)
                        .build();

                Lead savedLead = leadRepository.save(lead);
                campaign.setLeadsCount(campaign.getLeadsCount() + 1);

                // Broadcast lead to web socket for live monitoring feed
                LeadDto leadDto = LeadDto.builder()
                        .id(savedLead.getId())
                        .name(savedLead.getName())
                        .email(savedLead.getEmail())
                        .phone(savedLead.getPhone())
                        .sourcePlatform(savedLead.getSourcePlatform())
                        .campaignName(savedLead.getCampaignName())
                        .campaignId(campaign.getId())
                        .status(savedLead.getStatus())
                        .assignedToId(defaultAssignee != null ? defaultAssignee.getId() : null)
                        .assignedToName(defaultAssignee != null ? defaultAssignee.getFullName() : "Unassigned")
                        .createdAt(savedLead.getCreatedAt())
                        .build();

                webSocketManager.broadcastLead(workspaceId, leadDto);
                logDetails.append("Created Live Lead: ").append(lead.getName()).append(" (").append(email).append(")\n");
            }

            campaignRepository.save(campaign);

            // Update/insert metrics for today
            AdMetrics todayMetrics = adMetricsRepository.findByWorkspaceIdAndDateBetween(workspaceId, LocalDate.now(), LocalDate.now())
                    .stream()
                    .filter(m -> m.getCampaign().getId().equals(campaign.getId()))
                    .findFirst()
                    .orElseGet(() -> AdMetrics.builder()
                            .workspace(campaign.getWorkspace())
                            .campaign(campaign)
                            .platform(platform)
                            .spend(BigDecimal.ZERO)
                            .clicks(0)
                            .impressions(0)
                            .conversions(0)
                            .date(LocalDate.now())
                            .build());

            todayMetrics.setImpressions(todayMetrics.getImpressions() + addedImpressions);
            todayMetrics.setClicks(todayMetrics.getClicks() + addedClicks);
            todayMetrics.setSpend(todayMetrics.getSpend().add(addedSpend));
            todayMetrics.setConversions(todayMetrics.getConversions() + addedConversions);
            adMetricsRepository.save(todayMetrics);

            logDetails.append(String.format("Campaign '%s': Spend +$%s, Clicks +%d, Conversions +%d\n",
                    campaign.getName(), addedSpend, addedClicks, addedConversions));
        }

        // Update last synced date on integration record
        for (Integration integration : integrations) {
            if (integration.getPlatform().equalsIgnoreCase(platform)) {
                integration.setLastSyncedAt(LocalDateTime.now());
                integrationRepository.save(integration);
            }
        }

        saveSyncLog(workspaceId, platform, "Success", logDetails.toString());
    }

    private void saveSyncLog(Long workspaceId, String platform, String status, String details) {
        Workspace ws = Workspace.builder().id(workspaceId).build();
        SyncLog log = SyncLog.builder()
                .workspace(ws)
                .platform(platform)
                .status(status)
                .details(details)
                .build();
        syncLogRepository.save(log);
    }
}
