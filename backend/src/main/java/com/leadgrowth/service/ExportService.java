package com.leadgrowth.service;

import com.leadgrowth.dto.LeadDto;
import com.leadgrowth.entity.Campaign;
import com.leadgrowth.entity.Lead;
import com.leadgrowth.repository.CampaignRepository;
import com.leadgrowth.repository.LeadRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
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
        String dateStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        sb.append("================================================================================\n");
        sb.append("                       LEADGROWTH ENTERPRISE CRM                                \n");
        sb.append("                    CAMPAIGN PERFORMANCE AUDIT REPORT                          \n");
        sb.append("================================================================================\n");
        sb.append("Generated On : ").append(dateStr).append("\n");
        sb.append("Report Type  : Executive Campaign Summary\n");
        sb.append("--------------------------------------------------------------------------------\n\n");

        for (Campaign c : campaigns) {
            sb.append("CAMPAIGN DETAILS\n");
            sb.append("  Name         : ").append(c.getName()).append("\n");
            sb.append("  Platform     : ").append(c.getPlatform()).append("\n");
            sb.append("  Status       : ").append(c.getStatus()).append("\n");
            sb.append("  Spend        : $").append(c.getSpend()).append("\n");
            sb.append("  Revenue      : $").append(c.getRevenue()).append("\n");
            sb.append("  Conversions  : ").append(c.getConversions()).append("\n");
            sb.append("  Leads Count  : ").append(c.getLeadsCount()).append("\n");
            sb.append("--------------------------------------------------------------------------------\n");
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
        String dateStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        sb.append("================================================================================\n");
        sb.append("                       LEADGROWTH ENTERPRISE CRM                                \n");
        sb.append("                      PIPELINE LEAD DOSSIER REPORT                              \n");
        sb.append("================================================================================\n");
        sb.append("Generated On  : ").append(dateStr).append("\n");
        sb.append("Total Leads   : ").append(leads.size()).append("\n");
        sb.append("--------------------------------------------------------------------------------\n\n");

        for (LeadDto l : leads) {
            sb.append("CLIENT INFORMATION\n");
            sb.append("  ID / Name    : #").append(l.getId()).append(" - ").append(l.getName()).append("\n");
            sb.append("  Company      : ").append(l.getCompany() != null ? l.getCompany() : "N/A").append("\n");
            sb.append("  Email        : ").append(l.getEmail()).append("\n");
            sb.append("  Phone        : ").append(l.getPhone() != null ? l.getPhone() : "N/A").append("\n");
            sb.append("  Campaign     : ").append(l.getCampaignName() != null ? l.getCampaignName() : "Organic").append("\n");
            sb.append("  Pipeline Step: ").append(l.getStatus()).append("\n");
            sb.append("  Priority     : ").append(l.getPriority() != null ? l.getPriority() : "MEDIUM").append("\n");
            sb.append("  Quality Tier : ").append(l.getQualityTier() != null ? l.getQualityTier() : "WARM")
                    .append(" (").append(l.getQualityScore() != null ? l.getQualityScore() : 75).append(" pts)\n");
            sb.append("  Progress     : ").append(l.getProgressPercentage() != null ? l.getProgressPercentage() : 25).append("%\n");
            sb.append("  Assigned To  : ").append(l.getAssignedToName() != null ? l.getAssignedToName() : "Unassigned").append("\n");
            sb.append("--------------------------------------------------------------------------------\n");
        }
        return sb.toString().getBytes();
    }

    public byte[] exportSingleLeadPdf(Long leadId) {
        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new RuntimeException("Lead not found: " + leadId));

        StringBuilder sb = new StringBuilder();
        String dateStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        sb.append("================================================================================\n");
        sb.append("                       LEADGROWTH ENTERPRISE CRM                                \n");
        sb.append("                    INDIVIDUAL CLIENT DOSSIER & TIMELINE                        \n");
        sb.append("================================================================================\n");
        sb.append("Generated On  : ").append(dateStr).append("\n");
        sb.append("Lead ID       : #").append(lead.getId()).append("\n");
        sb.append("Client Name   : ").append(lead.getName()).append("\n");
        sb.append("Company       : ").append(lead.getCompany() != null ? lead.getCompany() : "N/A").append("\n");
        sb.append("Email         : ").append(lead.getEmail()).append("\n");
        sb.append("Phone         : ").append(lead.getPhone() != null ? lead.getPhone() : "N/A").append("\n");
        sb.append("Source        : ").append(lead.getSourcePlatform() != null ? lead.getSourcePlatform() : "Meta").append("\n");
        sb.append("Campaign      : ").append(lead.getCampaignName() != null ? lead.getCampaignName() : "General").append("\n");
        sb.append("Priority      : ").append(lead.getPriority() != null ? lead.getPriority() : "MEDIUM").append("\n");
        sb.append("Quality Tier  : ").append(lead.getQualityTier() != null ? lead.getQualityTier() : "WARM").append("\n");
        sb.append("Current Step  : ").append(lead.getStatus()).append("\n");
        sb.append("Progress %    : ").append(lead.getProgressPercentage() != null ? lead.getProgressPercentage() : 25).append("%\n");
        sb.append("Assigned Owner: ").append(lead.getAssignedTo() != null ? lead.getAssignedTo().getFullName() : "Unassigned").append("\n");
        sb.append("--------------------------------------------------------------------------------\n");
        sb.append("CLIENT NOTES & REMARKS:\n");
        sb.append(lead.getClientNotes() != null ? lead.getClientNotes() : "No custom remarks logged.").append("\n");
        sb.append("================================================================================\n");

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
