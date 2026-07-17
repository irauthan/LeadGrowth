package com.leadgrowth.controller;

import com.leadgrowth.dto.LeadDto;
import com.leadgrowth.entity.Campaign;
import com.leadgrowth.service.CampaignService;
import com.leadgrowth.service.ExportService;
import com.leadgrowth.service.LeadService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ExportService exportService;
    private final CampaignService campaignService;
    private final LeadService leadService;

    public ReportController(ExportService exportService, CampaignService campaignService, LeadService leadService) {
        this.exportService = exportService;
        this.campaignService = campaignService;
        this.leadService = leadService;
    }

    // --- Campaign Report Endpoints ---

    @GetMapping("/campaigns/csv")
    public ResponseEntity<byte[]> downloadCampaignsCsv() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        List<Campaign> campaigns = campaignService.getCampaigns(email);
        byte[] data = exportService.exportCampaignsToCsv(campaigns);
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=campaigns.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(data);
    }

    @GetMapping("/campaigns/excel")
    public ResponseEntity<byte[]> downloadCampaignsExcel() throws Exception {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        List<Campaign> campaigns = campaignService.getCampaigns(email);
        byte[] data = exportService.exportCampaignsToExcel(campaigns);
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=campaigns.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(data);
    }

    @GetMapping("/campaigns/pdf")
    public ResponseEntity<byte[]> downloadCampaignsPdf() throws Exception {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        List<Campaign> campaigns = campaignService.getCampaigns(email);
        byte[] data = exportService.exportCampaignsToPdf(campaigns);
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=campaigns.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(data);
    }

    // --- Lead Report Endpoints ---

    @GetMapping("/leads/csv")
    public ResponseEntity<byte[]> downloadLeadsCsv() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        List<LeadDto> leads = leadService.getLeads(email);
        byte[] data = exportService.exportLeadsToCsv(leads);
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=leads.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(data);
    }

    @GetMapping("/leads/excel")
    public ResponseEntity<byte[]> downloadLeadsExcel() throws Exception {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        List<LeadDto> leads = leadService.getLeads(email);
        byte[] data = exportService.exportLeadsToExcel(leads);
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=leads.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(data);
    }

    @GetMapping("/leads/pdf")
    public ResponseEntity<byte[]> downloadLeadsPdf() throws Exception {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        List<LeadDto> leads = leadService.getLeads(email);
        byte[] data = exportService.exportLeadsToPdf(leads);
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=leads.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(data);
    }
}
