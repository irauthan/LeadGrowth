package com.leadgrowth.service;

import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import com.leadgrowth.dto.LeadDto;
import com.leadgrowth.entity.Campaign;
import com.leadgrowth.entity.Lead;
import com.leadgrowth.repository.CampaignRepository;
import com.leadgrowth.repository.LeadRepository;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
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

    // --- CSV Exports with UTF-8 BOM ---

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
        return prependBom(sb.toString().getBytes(StandardCharsets.UTF_8));
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
        return prependBom(sb.toString().getBytes(StandardCharsets.UTF_8));
    }

    // --- Real Excel (.xlsx) Exports using Apache POI ---

    public byte[] exportCampaignsToExcel(List<Campaign> campaigns) {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Campaigns");

            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);

            String[] headers = {"ID", "Campaign Name", "Platform", "Status", "Budget", "Spend", "Revenue", "Clicks", "Impressions", "Leads", "Conversions", "Created At"};
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 1;
            for (Campaign c : campaigns) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(c.getId() != null ? c.getId() : 0);
                row.createCell(1).setCellValue(c.getName() != null ? c.getName() : "");
                row.createCell(2).setCellValue(c.getPlatform() != null ? c.getPlatform() : "");
                row.createCell(3).setCellValue(c.getStatus() != null ? c.getStatus() : "");
                row.createCell(4).setCellValue(c.getBudget() != null ? c.getBudget().doubleValue() : 0);
                row.createCell(5).setCellValue(c.getSpend() != null ? c.getSpend().doubleValue() : 0);
                row.createCell(6).setCellValue(c.getRevenue() != null ? c.getRevenue().doubleValue() : 0);
                row.createCell(7).setCellValue(c.getClicks() != null ? c.getClicks() : 0);
                row.createCell(8).setCellValue(c.getImpressions() != null ? c.getImpressions() : 0);
                row.createCell(9).setCellValue(c.getLeadsCount() != null ? c.getLeadsCount() : 0);
                row.createCell(10).setCellValue(c.getConversions() != null ? c.getConversions() : 0);
                row.createCell(11).setCellValue(c.getCreatedAt() != null ? c.getCreatedAt().toString() : "");
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error generating Excel file", e);
        }
    }

    public byte[] exportLeadsToExcel(List<LeadDto> leads) {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Leads");

            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);

            String[] headers = {"Lead ID", "Name", "Email", "Phone", "Platform", "Campaign", "Status", "Assignee", "Quality Score", "Quality Tier", "Created At"};
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 1;
            for (LeadDto l : leads) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(l.getId() != null ? l.getId() : 0);
                row.createCell(1).setCellValue(l.getName() != null ? l.getName() : "");
                row.createCell(2).setCellValue(l.getEmail() != null ? l.getEmail() : "");
                row.createCell(3).setCellValue(l.getPhone() != null ? l.getPhone() : "");
                row.createCell(4).setCellValue(l.getSourcePlatform() != null ? l.getSourcePlatform() : "");
                row.createCell(5).setCellValue(l.getCampaignName() != null ? l.getCampaignName() : "");
                row.createCell(6).setCellValue(l.getStatus() != null ? l.getStatus() : "");
                row.createCell(7).setCellValue(l.getAssignedToName() != null ? l.getAssignedToName() : "");
                row.createCell(8).setCellValue(l.getQualityScore() != null ? l.getQualityScore() : 75);
                row.createCell(9).setCellValue(l.getQualityTier() != null ? l.getQualityTier() : "WARM");
                row.createCell(10).setCellValue(l.getCreatedAt() != null ? l.getCreatedAt().toString() : "");
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error generating Excel file", e);
        }
    }

    // --- Real Binary PDF Exports using iText PDF ---

    public byte[] exportCampaignsToPdf(List<Campaign> campaigns, String workspaceName) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 36, 36, 36, 36);
            PdfWriter.getInstance(document, out);
            document.open();

            BaseColor primaryColor = new BaseColor(49, 130, 206);
            BaseColor darkText = new BaseColor(30, 41, 59);

            com.itextpdf.text.Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, primaryColor);
            Paragraph title = new Paragraph("LEADGROWTH ENTERPRISE CRM", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);

            com.itextpdf.text.Font subTitleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, darkText);
            Paragraph subTitle = new Paragraph("CAMPAIGN PERFORMANCE AUDIT REPORT", subTitleFont);
            subTitle.setAlignment(Element.ALIGN_CENTER);
            document.add(subTitle);

            document.add(new Paragraph(" "));

            com.itextpdf.text.Font metaBold = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, darkText);
            com.itextpdf.text.Font metaNormal = FontFactory.getFont(FontFactory.HELVETICA, 10, darkText);

            PdfPTable metaTable = new PdfPTable(2);
            metaTable.setWidthPercentage(100);

            PdfPCell cell1 = new PdfPCell(new Phrase("COMPANY / WORKSPACE: " + (workspaceName != null ? workspaceName.toUpperCase() : "LEADGROWTH WORKSPACE"), metaBold));
            cell1.setBorder(Rectangle.NO_BORDER);
            metaTable.addCell(cell1);

            String dateStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
            PdfPCell cell2 = new PdfPCell(new Phrase("GENERATED ON: " + dateStr, metaNormal));
            cell2.setHorizontalAlignment(Element.ALIGN_RIGHT);
            cell2.setBorder(Rectangle.NO_BORDER);
            metaTable.addCell(cell2);

            document.add(metaTable);
            document.add(new Paragraph("----------------------------------------------------------------------------------------------------------------"));
            document.add(new Paragraph(" "));

            PdfPTable table = new PdfPTable(6);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{1.5f, 3f, 2f, 2f, 2f, 2f});

            com.itextpdf.text.Font thFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, BaseColor.WHITE);
            String[] headers = {"ID", "Campaign Name", "Platform", "Status", "Spend", "Revenue"};
            for (String h : headers) {
                PdfPCell th = new PdfPCell(new Phrase(h, thFont));
                th.setBackgroundColor(primaryColor);
                th.setPadding(6);
                table.addCell(th);
            }

            com.itextpdf.text.Font tdFont = FontFactory.getFont(FontFactory.HELVETICA, 8, darkText);
            for (Campaign c : campaigns) {
                table.addCell(new PdfPCell(new Phrase("#" + c.getId(), tdFont)));
                table.addCell(new PdfPCell(new Phrase(c.getName() != null ? c.getName() : "N/A", tdFont)));
                table.addCell(new PdfPCell(new Phrase(c.getPlatform() != null ? c.getPlatform() : "N/A", tdFont)));
                table.addCell(new PdfPCell(new Phrase(c.getStatus() != null ? c.getStatus() : "ACTIVE", tdFont)));
                table.addCell(new PdfPCell(new Phrase("$" + (c.getSpend() != null ? c.getSpend() : 0), tdFont)));
                table.addCell(new PdfPCell(new Phrase("$" + (c.getRevenue() != null ? c.getRevenue() : 0), tdFont)));
            }

            document.add(table);
            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error generating Campaign PDF report", e);
        }
    }

    public byte[] exportLeadsToPdf(List<LeadDto> leads, String workspaceName) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 36, 36, 36, 36);
            PdfWriter.getInstance(document, out);
            document.open();

            BaseColor primaryColor = new BaseColor(49, 130, 206);
            BaseColor darkText = new BaseColor(30, 41, 59);

            com.itextpdf.text.Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, primaryColor);
            Paragraph title = new Paragraph("LEADGROWTH ENTERPRISE CRM", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);

            com.itextpdf.text.Font subTitleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, darkText);
            Paragraph subTitle = new Paragraph("PIPELINE LEAD DOSSIER REPORT", subTitleFont);
            subTitle.setAlignment(Element.ALIGN_CENTER);
            document.add(subTitle);

            document.add(new Paragraph(" "));

            com.itextpdf.text.Font metaBold = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, darkText);
            com.itextpdf.text.Font metaNormal = FontFactory.getFont(FontFactory.HELVETICA, 10, darkText);

            PdfPTable metaTable = new PdfPTable(2);
            metaTable.setWidthPercentage(100);

            PdfPCell cell1 = new PdfPCell(new Phrase("COMPANY / WORKSPACE: " + (workspaceName != null ? workspaceName.toUpperCase() : "LEADGROWTH WORKSPACE"), metaBold));
            cell1.setBorder(Rectangle.NO_BORDER);
            metaTable.addCell(cell1);

            String dateStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
            PdfPCell cell2 = new PdfPCell(new Phrase("GENERATED ON: " + dateStr, metaNormal));
            cell2.setHorizontalAlignment(Element.ALIGN_RIGHT);
            cell2.setBorder(Rectangle.NO_BORDER);
            metaTable.addCell(cell2);

            document.add(metaTable);
            document.add(new Paragraph("----------------------------------------------------------------------------------------------------------------"));
            document.add(new Paragraph(" "));

            PdfPTable table = new PdfPTable(6);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{1.5f, 2.5f, 2.5f, 2f, 2f, 2f});

            com.itextpdf.text.Font thFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, BaseColor.WHITE);
            String[] headers = {"Lead ID", "Client Name", "Email", "Platform", "Stage", "Assignee"};
            for (String h : headers) {
                PdfPCell th = new PdfPCell(new Phrase(h, thFont));
                th.setBackgroundColor(primaryColor);
                th.setPadding(6);
                table.addCell(th);
            }

            com.itextpdf.text.Font tdFont = FontFactory.getFont(FontFactory.HELVETICA, 8, darkText);
            for (LeadDto l : leads) {
                table.addCell(new PdfPCell(new Phrase("#" + l.getId(), tdFont)));
                table.addCell(new PdfPCell(new Phrase(l.getName() != null ? l.getName() : "N/A", tdFont)));
                table.addCell(new PdfPCell(new Phrase(l.getEmail() != null ? l.getEmail() : "N/A", tdFont)));
                table.addCell(new PdfPCell(new Phrase(l.getSourcePlatform() != null ? l.getSourcePlatform() : "Meta", tdFont)));
                table.addCell(new PdfPCell(new Phrase(l.getStatus() != null ? l.getStatus() : "New", tdFont)));
                table.addCell(new PdfPCell(new Phrase(l.getAssignedToName() != null ? l.getAssignedToName() : "Unassigned", tdFont)));
            }

            document.add(table);
            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error generating Lead PDF report", e);
        }
    }

    public byte[] exportSingleLeadPdf(Long leadId) {
        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new RuntimeException("Lead not found: " + leadId));

        String workspaceName = lead.getWorkspace() != null ? lead.getWorkspace().getName() : "LeadGrowth Workspace";

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 36, 36, 36, 36);
            PdfWriter.getInstance(document, out);
            document.open();

            BaseColor primaryColor = new BaseColor(49, 130, 206);
            BaseColor darkText = new BaseColor(30, 41, 59);

            com.itextpdf.text.Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, primaryColor);
            Paragraph title = new Paragraph("LEADGROWTH ENTERPRISE CRM", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);

            com.itextpdf.text.Font subTitleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, darkText);
            Paragraph subTitle = new Paragraph("EXECUTIVE CLIENT DOSSIER", subTitleFont);
            subTitle.setAlignment(Element.ALIGN_CENTER);
            document.add(subTitle);

            document.add(new Paragraph(" "));

            com.itextpdf.text.Font metaBold = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, darkText);
            com.itextpdf.text.Font metaNormal = FontFactory.getFont(FontFactory.HELVETICA, 10, darkText);

            PdfPTable metaTable = new PdfPTable(2);
            metaTable.setWidthPercentage(100);

            PdfPCell cell1 = new PdfPCell(new Phrase("COMPANY / WORKSPACE: " + workspaceName.toUpperCase(), metaBold));
            cell1.setBorder(Rectangle.NO_BORDER);
            metaTable.addCell(cell1);

            String dateStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
            PdfPCell cell2 = new PdfPCell(new Phrase("GENERATED ON: " + dateStr, metaNormal));
            cell2.setHorizontalAlignment(Element.ALIGN_RIGHT);
            cell2.setBorder(Rectangle.NO_BORDER);
            metaTable.addCell(cell2);

            document.add(metaTable);
            document.add(new Paragraph("----------------------------------------------------------------------------------------------------------------"));
            document.add(new Paragraph(" "));

            PdfPTable table = new PdfPTable(2);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{1f, 2f});

            com.itextpdf.text.Font labelFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, darkText);
            com.itextpdf.text.Font valFont = FontFactory.getFont(FontFactory.HELVETICA, 9, darkText);

            addPdfRow(table, "Lead ID", "#" + lead.getId(), labelFont, valFont);
            addPdfRow(table, "Client Name", lead.getName(), labelFont, valFont);
            addPdfRow(table, "Company", lead.getCompany() != null ? lead.getCompany() : "N/A", labelFont, valFont);
            addPdfRow(table, "Email Address", lead.getEmail(), labelFont, valFont);
            addPdfRow(table, "Phone Number", lead.getPhone() != null ? lead.getPhone() : "N/A", labelFont, valFont);
            addPdfRow(table, "Source Platform", lead.getSourcePlatform() != null ? lead.getSourcePlatform() : "Meta", labelFont, valFont);
            addPdfRow(table, "Campaign Name", lead.getCampaignName() != null ? lead.getCampaignName() : "Direct", labelFont, valFont);
            addPdfRow(table, "Priority Level", lead.getPriority() != null ? lead.getPriority() : "MEDIUM", labelFont, valFont);
            addPdfRow(table, "Quality Score / Tier", (lead.getQualityTier() != null ? lead.getQualityTier() : "WARM") + " (" + (lead.getQualityScore() != null ? lead.getQualityScore() : 75) + " pts)", labelFont, valFont);
            addPdfRow(table, "Current Pipeline Stage", lead.getStatus(), labelFont, valFont);
            addPdfRow(table, "Progress Percentage", (lead.getProgressPercentage() != null ? lead.getProgressPercentage() : 25) + "%", labelFont, valFont);
            addPdfRow(table, "Assigned Owner", lead.getAssignedTo() != null ? lead.getAssignedTo().getFullName() : "Unassigned", labelFont, valFont);
            addPdfRow(table, "Client Notes & Activity", lead.getClientNotes() != null ? lead.getClientNotes() : "No notes recorded", labelFont, valFont);

            document.add(table);
            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error generating Lead PDF Dossier", e);
        }
    }

    private void addPdfRow(PdfPTable table, String label, String value, com.itextpdf.text.Font labelFont, com.itextpdf.text.Font valFont) {
        PdfPCell c1 = new PdfPCell(new Phrase(label, labelFont));
        c1.setPadding(6);
        c1.setBackgroundColor(new BaseColor(241, 245, 249));
        table.addCell(c1);

        PdfPCell c2 = new PdfPCell(new Phrase(value, valFont));
        c2.setPadding(6);
        table.addCell(c2);
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
        return prependBom(sb.toString().getBytes(StandardCharsets.UTF_8));
    }

    public byte[] generateCampaignsExportCsv(Long workspaceId) {
        List<Campaign> campaigns = campaignRepository.findByWorkspaceId(workspaceId);
        return exportCampaignsToCsv(campaigns);
    }

    private byte[] prependBom(byte[] data) {
        byte[] bom = new byte[]{(byte) 0xEF, (byte) 0xBB, (byte) 0xBF};
        byte[] result = new byte[bom.length + data.length];
        System.arraycopy(bom, 0, result, 0, bom.length);
        System.arraycopy(data, 0, result, bom.length, data.length);
        return result;
    }

    private String escapeCsv(String value) {
        if (value == null) return "\"\"";
        return "\"" + value.replace("\"", "\"\"") + "\"";
    }
}
