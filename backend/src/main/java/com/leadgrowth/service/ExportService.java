package com.leadgrowth.service;

import com.itextpdf.text.*;
import com.itextpdf.text.pdf.PdfPCell;
import com.itextpdf.text.pdf.PdfPTable;
import com.itextpdf.text.pdf.PdfWriter;
import com.leadgrowth.dto.LeadDto;
import com.leadgrowth.entity.Campaign;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.PrintWriter;
import java.math.BigDecimal;
import java.util.List;

@Service
public class ExportService {

    // --- Campaign Exports ---

    public byte[] exportCampaignsToCsv(List<Campaign> campaigns) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try (PrintWriter writer = new PrintWriter(out)) {
            writer.println("Campaign Name,Platform,Status,Impressions,Clicks,CTR,CPC,Leads,Conversions,Spend,Revenue,ROAS");
            for (Campaign c : campaigns) {
                String name = c.getName() != null ? c.getName() : "";
                String platform = c.getPlatform() != null ? c.getPlatform() : "";
                String status = c.getStatus() != null ? c.getStatus() : "";
                int impressions = c.getImpressions() != null ? c.getImpressions() : 0;
                int clicks = c.getClicks() != null ? c.getClicks() : 0;
                int leadsCount = c.getLeadsCount() != null ? c.getLeadsCount() : 0;
                int conversions = c.getConversions() != null ? c.getConversions() : 0;
                BigDecimal spend = c.getSpend() != null ? c.getSpend() : BigDecimal.ZERO;
                BigDecimal revenue = c.getRevenue() != null ? c.getRevenue() : BigDecimal.ZERO;

                double ctr = impressions > 0 ? ((double) clicks / impressions) * 100 : 0.0;
                double cpc = clicks > 0 ? spend.doubleValue() / clicks : 0.0;
                double roas = spend.compareTo(BigDecimal.ZERO) > 0 ? revenue.doubleValue() / spend.doubleValue() : 0.0;

                writer.printf("\"%s\",%s,%s,%d,%d,%.2f%%,$%.2f,%d,%d,$%.2f,$%.2f,%.2fx\n",
                        name.replace("\"", "\"\""),
                        platform,
                        status,
                        impressions,
                        clicks,
                        ctr,
                        cpc,
                        leadsCount,
                        conversions,
                        spend,
                        revenue,
                        roas
                );
            }
            writer.flush();
        }
        return out.toByteArray();
    }

    public byte[] exportCampaignsToExcel(List<Campaign> campaigns) throws IOException {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Campaign Analytics");
            
            // Header Row
            Row headerRow = sheet.createRow(0);
            String[] headers = {"Campaign Name", "Platform", "Status", "Impressions", "Clicks", "CTR", "CPC", "Leads", "Conversions", "Spend", "Revenue", "ROAS"};
            for (int i = 0; i < headers.length; i++) {
                headerRow.createCell(i).setCellValue(headers[i]);
            }

            int rowIdx = 1;
            for (Campaign c : campaigns) {
                Row row = sheet.createRow(rowIdx++);
                String name = c.getName() != null ? c.getName() : "";
                String platform = c.getPlatform() != null ? c.getPlatform() : "";
                String status = c.getStatus() != null ? c.getStatus() : "";
                int impressions = c.getImpressions() != null ? c.getImpressions() : 0;
                int clicks = c.getClicks() != null ? c.getClicks() : 0;
                int leadsCount = c.getLeadsCount() != null ? c.getLeadsCount() : 0;
                int conversions = c.getConversions() != null ? c.getConversions() : 0;
                BigDecimal spend = c.getSpend() != null ? c.getSpend() : BigDecimal.ZERO;
                BigDecimal revenue = c.getRevenue() != null ? c.getRevenue() : BigDecimal.ZERO;

                row.createCell(0).setCellValue(name);
                row.createCell(1).setCellValue(platform);
                row.createCell(2).setCellValue(status);
                row.createCell(3).setCellValue(impressions);
                row.createCell(4).setCellValue(clicks);
                
                double ctr = impressions > 0 ? ((double) clicks / impressions) * 100 : 0.0;
                row.createCell(5).setCellValue(String.format("%.2f%%", ctr));
                
                double cpc = clicks > 0 ? spend.doubleValue() / clicks : 0.0;
                row.createCell(6).setCellValue(String.format("$%.2f", cpc));
                
                row.createCell(7).setCellValue(leadsCount);
                row.createCell(8).setCellValue(conversions);
                row.createCell(9).setCellValue(spend.doubleValue());
                row.createCell(10).setCellValue(revenue.doubleValue());
                
                double roas = spend.compareTo(BigDecimal.ZERO) > 0 ? revenue.doubleValue() / spend.doubleValue() : 0.0;
                row.createCell(11).setCellValue(String.format("%.2fx", roas));
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    public byte[] exportCampaignsToPdf(List<Campaign> campaigns) throws DocumentException {
        Document document = new Document(PageSize.A4.rotate());
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PdfWriter.getInstance(document, out);
        
        document.open();
        
        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, BaseColor.DARK_GRAY);
        Paragraph title = new Paragraph("Campaign Performance Report", titleFont);
        title.setAlignment(Element.ALIGN_CENTER);
        title.setSpacingAfter(20);
        document.add(title);

        PdfPTable table = new PdfPTable(12);
        table.setWidthPercentage(100);
        
        String[] headers = {"Campaign", "Platform", "Status", "Imps", "Clicks", "CTR", "CPC", "Leads", "Conv", "Spend", "Rev", "ROAS"};
        Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, BaseColor.WHITE);
        for (String h : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(h, headerFont));
            cell.setBackgroundColor(new BaseColor(79, 70, 229));
            cell.setHorizontalAlignment(Element.ALIGN_CENTER);
            cell.setPadding(6);
            table.addCell(cell);
        }

        Font cellFont = FontFactory.getFont(FontFactory.HELVETICA, 8);
        for (Campaign c : campaigns) {
            String name = c.getName() != null ? c.getName() : "";
            String platform = c.getPlatform() != null ? c.getPlatform() : "";
            String status = c.getStatus() != null ? c.getStatus() : "";
            int impressions = c.getImpressions() != null ? c.getImpressions() : 0;
            int clicks = c.getClicks() != null ? c.getClicks() : 0;
            int leadsCount = c.getLeadsCount() != null ? c.getLeadsCount() : 0;
            int conversions = c.getConversions() != null ? c.getConversions() : 0;
            BigDecimal spend = c.getSpend() != null ? c.getSpend() : BigDecimal.ZERO;
            BigDecimal revenue = c.getRevenue() != null ? c.getRevenue() : BigDecimal.ZERO;

            double ctr = impressions > 0 ? ((double) clicks / impressions) * 100 : 0.0;
            double cpc = clicks > 0 ? spend.doubleValue() / clicks : 0.0;
            double roas = spend.compareTo(BigDecimal.ZERO) > 0 ? revenue.doubleValue() / spend.doubleValue() : 0.0;

            table.addCell(new PdfPCell(new Phrase(name, cellFont)));
            table.addCell(new PdfPCell(new Phrase(platform, cellFont)));
            table.addCell(new PdfPCell(new Phrase(status, cellFont)));
            table.addCell(new PdfPCell(new Phrase(String.valueOf(impressions), cellFont)));
            table.addCell(new PdfPCell(new Phrase(String.valueOf(clicks), cellFont)));
            table.addCell(new PdfPCell(new Phrase(String.format("%.2f%%", ctr), cellFont)));
            table.addCell(new PdfPCell(new Phrase(String.format("$%.2f", cpc), cellFont)));
            table.addCell(new PdfPCell(new Phrase(String.valueOf(leadsCount), cellFont)));
            table.addCell(new PdfPCell(new Phrase(String.valueOf(conversions), cellFont)));
            table.addCell(new PdfPCell(new Phrase(String.format("$%.2f", spend), cellFont)));
            table.addCell(new PdfPCell(new Phrase(String.format("$%.2f", revenue), cellFont)));
            table.addCell(new PdfPCell(new Phrase(String.format("%.2fx", roas), cellFont)));
        }

        document.add(table);
        document.close();
        return out.toByteArray();
    }

    // --- Lead Exports ---

    public byte[] exportLeadsToCsv(List<LeadDto> leads) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try (PrintWriter writer = new PrintWriter(out)) {
            writer.println("Lead ID,Name,Email,Phone,Source Platform,Campaign Name,Status,Created At");
            for (LeadDto l : leads) {
                String name = l.getName() != null ? l.getName() : "";
                String email = l.getEmail() != null ? l.getEmail() : "";
                String phone = l.getPhone() != null ? l.getPhone() : "";
                String platform = l.getSourcePlatform() != null ? l.getSourcePlatform() : "";
                String campaignName = l.getCampaignName() != null ? l.getCampaignName() : "";
                String status = l.getStatus() != null ? l.getStatus() : "";
                String createdAt = l.getCreatedAt() != null ? l.getCreatedAt().toString() : "";

                writer.printf("%d,\"%s\",\"%s\",\"%s\",%s,\"%s\",%s,%s\n",
                        l.getId() != null ? l.getId() : 0,
                        name.replace("\"", "\"\""),
                        email,
                        phone,
                        platform,
                        campaignName.replace("\"", "\"\""),
                        status,
                        createdAt
                );
            }
            writer.flush();
        }
        return out.toByteArray();
    }

    public byte[] exportLeadsToExcel(List<LeadDto> leads) throws IOException {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Leads List");
            
            // Header Row
            Row headerRow = sheet.createRow(0);
            String[] headers = {"Lead ID", "Name", "Email", "Phone", "Source Platform", "Campaign Name", "Status", "Created At"};
            for (int i = 0; i < headers.length; i++) {
                headerRow.createCell(i).setCellValue(headers[i]);
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
                row.createCell(7).setCellValue(l.getCreatedAt() != null ? l.getCreatedAt().toString() : "");
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    public byte[] exportLeadsToPdf(List<LeadDto> leads) throws DocumentException {
        Document document = new Document(PageSize.A4.rotate());
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PdfWriter.getInstance(document, out);
        
        document.open();
        
        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, BaseColor.DARK_GRAY);
        Paragraph title = new Paragraph("Leads Management Report", titleFont);
        title.setAlignment(Element.ALIGN_CENTER);
        title.setSpacingAfter(20);
        document.add(title);

        PdfPTable table = new PdfPTable(8);
        table.setWidthPercentage(100);
        
        String[] headers = {"ID", "Name", "Email", "Phone", "Platform", "Campaign", "Status", "Date"};
        Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, BaseColor.WHITE);
        for (String h : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(h, headerFont));
            cell.setBackgroundColor(new BaseColor(79, 70, 229));
            cell.setHorizontalAlignment(Element.ALIGN_CENTER);
            cell.setPadding(6);
            table.addCell(cell);
        }

        Font cellFont = FontFactory.getFont(FontFactory.HELVETICA, 9);
        for (LeadDto l : leads) {
            String createdStr = "";
            if (l.getCreatedAt() != null) {
                String fullStr = l.getCreatedAt().toString();
                createdStr = fullStr.length() >= 10 ? fullStr.substring(0, 10) : fullStr;
            }

            table.addCell(new PdfPCell(new Phrase(String.valueOf(l.getId() != null ? l.getId() : ""), cellFont)));
            table.addCell(new PdfPCell(new Phrase(l.getName() != null ? l.getName() : "", cellFont)));
            table.addCell(new PdfPCell(new Phrase(l.getEmail() != null ? l.getEmail() : "", cellFont)));
            table.addCell(new PdfPCell(new Phrase(l.getPhone() != null ? l.getPhone() : "", cellFont)));
            table.addCell(new PdfPCell(new Phrase(l.getSourcePlatform() != null ? l.getSourcePlatform() : "", cellFont)));
            table.addCell(new PdfPCell(new Phrase(l.getCampaignName() != null ? l.getCampaignName() : "", cellFont)));
            table.addCell(new PdfPCell(new Phrase(l.getStatus() != null ? l.getStatus() : "", cellFont)));
            table.addCell(new PdfPCell(new Phrase(createdStr, cellFont)));
        }

        document.add(table);
        document.close();
        return out.toByteArray();
    }
}
