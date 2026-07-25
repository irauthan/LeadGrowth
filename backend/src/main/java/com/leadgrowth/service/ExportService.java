package com.leadgrowth.service;

import com.leadgrowth.dto.LeadDto;
import com.leadgrowth.entity.Campaign;
import com.leadgrowth.entity.Lead;
import com.leadgrowth.repository.CampaignRepository;
import com.leadgrowth.repository.LeadRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ExportService {

    private final LeadRepository leadRepository;
    private final CampaignRepository campaignRepository;

    public ExportService(LeadRepository leadRepository, CampaignRepository campaignRepository) {
        this.leadRepository = leadRepository;
        this.campaignRepository = campaignRepository;
    }

    public byte[] exportCampaignsToCsv(List<Campaign> campaigns) {
        StringBuilder sb = new StringBuilder();
        sb.append("ID,Campaign Name,Platform,Status,Budget,Spend,Revenue,Clicks,Impressions,Leads,Conversions,Created At\n");

        for (Campaign c : campaigns) {
            sb.append(c.getId()).append(",")
                    .append(escapeCsv(c.getName())).append(",")
                    .append(escapeCsv(c.getPlatform())).append(",")
                    .append(escapeCsv(c.getStatus())).append(",")
                    .append(c.getBudget()).append(",")
                    .append(c.getSpend()).append(",")
                    .append(c.getRevenue()).append(",")
                    .append(c.getClicks()).append(",")
                    .append(c.getImpressions()).append(",")
                    .append(c.getLeadsCount()).append(",")
                    .append(c.getConversions()).append(",")
                    .append(c.getCreatedAt()).append("\n");
        }
        return sb.toString().getBytes();
    }

    public byte[] exportCampaignsToExcel(List<Campaign> campaigns) {
        return exportCampaignsToCsv(campaigns);
    }

    public byte[] exportCampaignsToPdf(List<Campaign> campaigns) {
        StringBuilder sb = new StringBuilder();
        sb.append("PDF REPORT: CAMPAIGN PERFORMANCE\n===============================\n\n");
        for (Campaign c : campaigns) {
            sb.append("Campaign: ").append(c.getName()).append(" | Platform: ").append(c.getPlatform())
                    .append(" | Spend: $").append(c.getSpend()).append(" | Revenue: $").append(c.getRevenue())
                    .append(" | Conversions: ").append(c.getConversions()).append("\n");
        }
        return sb.toString().getBytes();
    }

    public byte[] exportLeadsToCsv(List<LeadDto> leads) {
        StringBuilder sb = new StringBuilder();
        sb.append("Lead ID,Name,Email,Phone,Platform,Campaign,Status,Assignee,Quality Score,Quality Tier,Created At\n");

        for (LeadDto l : leads) {
            sb.append(l.getId()).append(",")
                    .append(escapeCsv(l.getName())).append(",")
                    .append(escapeCsv(l.getEmail())).append(",")
                    .append(escapeCsv(l.getPhone())).append(",")
                    .append(escapeCsv(l.getSourcePlatform())).append(",")
                    .append(escapeCsv(l.getCampaignName())).append(",")
                    .append(escapeCsv(l.getStatus())).append(",")
                    .append(escapeCsv(l.getAssignedToName())).append(",")
                    .append(l.getQualityScore() != null ? l.getQualityScore() : 75).append(",")
                    .append(escapeCsv(l.getQualityTier() != null ? l.getQualityTier() : "WARM")).append(",")
                    .append(l.getCreatedAt()).append("\n");
        }
        return sb.toString().getBytes();
    }

    public byte[] exportLeadsToExcel(List<LeadDto> leads) {
        return exportLeadsToCsv(leads);
    }

    public byte[] exportLeadsToPdf(List<LeadDto> leads) {
        StringBuilder sb = new StringBuilder();
        sb.append("PDF REPORT: LEAD INTELLIGENCE\n===============================\n\n");
        for (LeadDto l : leads) {
            sb.append("Lead: ").append(l.getName()).append(" | Email: ").append(l.getEmail())
                    .append(" | Status: ").append(l.getStatus()).append(" | Tier: ").append(l.getQualityTier())
                    .append(" | Assignee: ").append(l.getAssignedToName()).append("\n");
        }
        return sb.toString().getBytes();
    }

    public byte[] generateLeadsExportCsv(Long workspaceId) {
        List<Lead> leads = leadRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceId);
        StringBuilder sb = new StringBuilder();
        sb.append("Lead ID,Name,Email,Phone,Platform,Campaign,Status,Assignee,Quality Score,Quality Tier,Created At\n");

        for (Lead l : leads) {
            sb.append(l.getId()).append(",")
                    .append(escapeCsv(l.getName())).append(",")
                    .append(escapeCsv(l.getEmail())).append(",")
                    .append(escapeCsv(l.getPhone())).append(",")
                    .append(escapeCsv(l.getSourcePlatform())).append(",")
                    .append(escapeCsv(l.getCampaignName())).append(",")
                    .append(escapeCsv(l.getStatus())).append(",")
                    .append(escapeCsv(l.getAssignedTo() != null ? l.getAssignedTo().getFullName() : "Unassigned")).append(",")
                    .append(l.getQualityScore() != null ? l.getQualityScore() : 75).append(",")
                    .append(escapeCsv(l.getQualityTier() != null ? l.getQualityTier() : "WARM")).append(",")
                    .append(l.getCreatedAt()).append("\n");
        }
        return sb.toString().getBytes();
    }

    public byte[] generateCampaignsExportCsv(Long workspaceId) {
        List<Campaign> campaigns = campaignRepository.findByWorkspaceId(workspaceId);
        return exportCampaignsToCsv(campaigns);
    }

    private String escapeCsv(String value) {
        if (value == null) return "\"\"";
        return "\"" + value.replace("\"", "\"\"") + "\"";
    }
}
