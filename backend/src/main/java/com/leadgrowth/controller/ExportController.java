package com.leadgrowth.controller;

import com.leadgrowth.entity.User;
import com.leadgrowth.repository.UserRepository;
import com.leadgrowth.service.ExportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports/export")
public class ExportController {

    private final ExportService exportService;
    private final UserRepository userRepository;

    public ExportController(ExportService exportService, UserRepository userRepository) {
        this.exportService = exportService;
        this.userRepository = userRepository;
    }

    @GetMapping("/leads")
    public ResponseEntity<byte[]> exportLeads(@RequestParam(defaultValue = "csv") String format) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        byte[] csvData = exportService.generateLeadsExportCsv(user.getWorkspace().getId());

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=leads_report.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csvData);
    }

    @GetMapping("/campaigns")
    public ResponseEntity<byte[]> exportCampaigns(@RequestParam(defaultValue = "csv") String format) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        byte[] csvData = exportService.generateCampaignsExportCsv(user.getWorkspace().getId());

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=campaigns_report.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csvData);
    }
}
