package com.leadgrowth.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "report_history")
public class ReportHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;

    @Column(name = "period_filter", nullable = false, length = 30) // daily, weekly, monthly, yearly, custom
    private String periodFilter;

    @Column(name = "start_date")
    private String startDate;

    @Column(name = "end_date")
    private String endDate;

    @Column(name = "export_format", nullable = false, length = 20) // PDF, EXCEL, CSV
    private String exportFormat;

    @Column(name = "report_category", nullable = false, length = 50) // DASHBOARD_KPI, LEAD_SUMMARY, CAMPAIGN_SUMMARY, FULL_SYSTEM
    private String reportCategory;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "generated_by_id")
    private User generatedBy;

    @Column(name = "file_name", length = 255)
    private String fileName;

    @Column(columnDefinition = "TEXT")
    private String kpiSummaryJson;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public ReportHistory() {}

    public ReportHistory(Long id, Workspace workspace, String periodFilter, String startDate, String endDate,
                         String exportFormat, String reportCategory, User generatedBy, String fileName,
                         String kpiSummaryJson, LocalDateTime createdAt) {
        this.id = id;
        this.workspace = workspace;
        this.periodFilter = periodFilter;
        this.startDate = startDate;
        this.endDate = endDate;
        this.exportFormat = exportFormat;
        this.reportCategory = reportCategory;
        this.generatedBy = generatedBy;
        this.fileName = fileName;
        this.kpiSummaryJson = kpiSummaryJson;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Workspace getWorkspace() { return workspace; }
    public void setWorkspace(Workspace workspace) { this.workspace = workspace; }

    public String getPeriodFilter() { return periodFilter; }
    public void setPeriodFilter(String periodFilter) { this.periodFilter = periodFilter; }

    public String getStartDate() { return startDate; }
    public void setStartDate(String startDate) { this.startDate = startDate; }

    public String getEndDate() { return endDate; }
    public void setEndDate(String endDate) { this.endDate = endDate; }

    public String getExportFormat() { return exportFormat; }
    public void setExportFormat(String exportFormat) { this.exportFormat = exportFormat; }

    public String getReportCategory() { return reportCategory; }
    public void setReportCategory(String reportCategory) { this.reportCategory = reportCategory; }

    public User getGeneratedBy() { return generatedBy; }
    public void setGeneratedBy(User generatedBy) { this.generatedBy = generatedBy; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public String getKpiSummaryJson() { return kpiSummaryJson; }
    public void setKpiSummaryJson(String kpiSummaryJson) { this.kpiSummaryJson = kpiSummaryJson; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public static ReportHistoryBuilder builder() {
        return new ReportHistoryBuilder();
    }

    public static class ReportHistoryBuilder {
        private Long id;
        private Workspace workspace;
        private String periodFilter;
        private String startDate;
        private String endDate;
        private String exportFormat;
        private String reportCategory;
        private User generatedBy;
        private String fileName;
        private String kpiSummaryJson;
        private LocalDateTime createdAt;

        ReportHistoryBuilder() {}

        public ReportHistoryBuilder id(Long id) { this.id = id; return this; }
        public ReportHistoryBuilder workspace(Workspace workspace) { this.workspace = workspace; return this; }
        public ReportHistoryBuilder periodFilter(String periodFilter) { this.periodFilter = periodFilter; return this; }
        public ReportHistoryBuilder startDate(String startDate) { this.startDate = startDate; return this; }
        public ReportHistoryBuilder endDate(String endDate) { this.endDate = endDate; return this; }
        public ReportHistoryBuilder exportFormat(String exportFormat) { this.exportFormat = exportFormat; return this; }
        public ReportHistoryBuilder reportCategory(String reportCategory) { this.reportCategory = reportCategory; return this; }
        public ReportHistoryBuilder generatedBy(User generatedBy) { this.generatedBy = generatedBy; return this; }
        public ReportHistoryBuilder fileName(String fileName) { this.fileName = fileName; return this; }
        public ReportHistoryBuilder kpiSummaryJson(String kpiSummaryJson) { this.kpiSummaryJson = kpiSummaryJson; return this; }
        public ReportHistoryBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public ReportHistory build() {
            return new ReportHistory(id, workspace, periodFilter, startDate, endDate, exportFormat, reportCategory, generatedBy, fileName, kpiSummaryJson, createdAt);
        }
    }
}
