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
            writer.println("Campaign Name,Platform,Impressions,Clicks,CTR,CPC,Leads,Conversions,Spend,Revenue,ROAS");
            for (Campaign c : campaigns) {
                double ctr = c.getImpressions() > 0 ? ((double) c.getClicks() / c.getImpressions()) * 100 : 0.0;
                double cpc = c.getClicks() > 0 ? c.getSpend().doubleValue() / c.getClicks() : 0.0;
                double roas = c.getSpend().compareTo(BigDecimal.ZERO) > 0 ? c.getRevenue().doubleValue() / c.getSpend().doubleValue() : 0.0;

                writer.printf("\"%s\",%s,%d,%d,%.2f%%,$%.2f,%d,%d,$%.2f,$%.2f,%.2fx\n",
                        c.getName().replace("\"", "\"\""),
                        c.getPlatform(),
                        c.getImpressions(),
                        c.getClicks(),
                        ctr,
                        cpc,
                        c.getLeadsCount(),
                        c.getConversions(),
                        c.getSpend(),
                        c.getRevenue(),
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
            String[] headers = {"Campaign Name", "Platform", "Impressions", "Clicks", "CTR", "CPC", "Leads", "Conversions", "Spend", "Revenue", "ROAS"};
            for (int i = 0; i < headers.length; i++) {
                headerRow.createCell(i).setCellValue(headers[i]);
            }

            int rowIdx = 1;
            for (Campaign c : campaigns) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(c.getName());
                row.createCell(1).setCellValue(c.getPlatform());
                row.createCell(2).setCellValue(c.getImpressions());
                row.createCell(3).setCellValue(c.getClicks());
                
                double ctr = c.getImpressions() > 0 ? ((double) c.getClicks() / c.getImpressions()) * 100 : 0.0;
                row.createCell(4).setCellValue(String.format("%.2f%%", ctr));
                
                double cpc = c.getClicks() > 0 ? c.getSpend().doubleValue() / c.getClicks() : 0.0;
                row.createCell(5).setCellValue(String.format("$%.2f", cpc));
                
                row.createCell(6).setCellValue(c.getLeadsCount());
                row.createCell(7).setCellValue(c.getConversions());
                row.createCell(8).setCellValue(c.getSpend().doubleValue());
                row.createCell(9).setCellValue(c.getRevenue().doubleValue());
                
                double roas = c.getSpend().compareTo(BigDecimal.ZERO) > 0 ? c.getRevenue().doubleValue() / c.getSpend().doubleValue() : 0.0;
                row.createCell(10).setCellValue(String.format("%.2fx", roas));
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

        PdfPTable table = new PdfPTable(11);
        table.setWidthPercentage(100);
        
        String[] headers = {"Campaign", "Platform", "Imps", "Clicks", "CTR", "CPC", "Leads", "Conv", "Spend", "Rev", "ROAS"};
        Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, BaseColor.WHITE);
        for (String h : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(h, headerFont));
            cell.setBackgroundColor(BaseColor.GRAY);
            cell.setHorizontalAlignment(Element.ALIGN_CENTER);
            table.addCell(cell);
        }

        Font cellFont = FontFactory.getFont(FontFactory.HELVETICA, 9);
        for (Campaign c : campaigns) {
            double ctr = c.getImpressions() > 0 ? ((double) c.getClicks() / c.getImpressions()) * 100 : 0.0;
            double cpc = c.getClicks() > 0 ? c.getSpend().doubleValue() / c.getClicks() : 0.0;
            double roas = c.getSpend().compareTo(BigDecimal.ZERO) > 0 ? c.getRevenue().doubleValue() / c.getSpend().doubleValue() : 0.0;

            table.addCell(new PdfPCell(new Phrase(c.getName(), cellFont)));
            table.addCell(new PdfPCell(new Phrase(c.getPlatform(), cellFont)));
            table.addCell(new PdfPCell(new Phrase(String.valueOf(c.getImpressions()), cellFont)));
            table.addCell(new PdfPCell(new Phrase(String.valueOf(c.getClicks()), cellFont)));
            table.addCell(new PdfPCell(new Phrase(String.format("%.2f%%", ctr), cellFont)));
            table.addCell(new PdfPCell(new Phrase(String.format("$%.2f", cpc), cellFont)));
            table.addCell(new PdfPCell(new Phrase(String.valueOf(c.getLeadsCount()), cellFont)));
            table.addCell(new PdfPCell(new Phrase(String.valueOf(c.getConversions()), cellFont)));
            table.addCell(new PdfPCell(new Phrase(String.format("$%.2f", c.getSpend()), cellFont)));
            table.addCell(new PdfPCell(new Phrase(String.format("$%.2f", c.getRevenue()), cellFont)));
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
                writer.printf("%d,\"%s\",\"%s\",\"%s\",%s,\"%s\",%s,%s\n",
                        l.getId(),
                        l.getName().replace("\"", "\"\""),
                        l.getEmail(),
                        l.getPhone() != null ? l.getPhone() : "",
                        l.getSourcePlatform(),
                        l.getCampaignName() != null ? l.getCampaignName().replace("\"", "\"\"") : "",
                        l.getStatus(),
                        l.getCreatedAt() != null ? l.getCreatedAt().toString() : ""
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
                row.createCell(0).setCellValue(l.getId());
                row.createCell(1).setCellValue(l.getName());
                row.createCell(2).setCellValue(l.getEmail());
                row.createCell(3).setCellValue(l.getPhone() != null ? l.getPhone() : "");
                row.createCell(4).setCellValue(l.getSourcePlatform());
                row.createCell(5).setCellValue(l.getCampaignName() != null ? l.getCampaignName() : "");
                row.createCell(6).setCellValue(l.getStatus());
                row.createCell(7).setCellValue(l.getCreatedAt() != null ? l.getCreatedAt().toString() : "");
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
            cell.setBackgroundColor(BaseColor.GRAY);
            cell.setHorizontalAlignment(Element.ALIGN_CENTER);
            table.addCell(cell);
        }

        Font cellFont = FontFactory.getFont(FontFactory.HELVETICA, 9);
        for (LeadDto l : leads) {
            table.addCell(new PdfPCell(new Phrase(String.valueOf(l.getId()), cellFont)));
            table.addCell(new PdfPCell(new Phrase(l.getName(), cellFont)));
            table.addCell(new PdfPCell(new Phrase(l.getEmail(), cellFont)));
            table.addCell(new PdfPCell(new Phrase(l.getPhone() != null ? l.getPhone() : "", cellFont)));
            table.addCell(new PdfPCell(new Phrase(l.getSourcePlatform(), cellFont)));
            table.addCell(new PdfPCell(new Phrase(l.getCampaignName() != null ? l.getCampaignName() : "", cellFont)));
            table.addCell(new PdfPCell(new Phrase(l.getStatus(), cellFont)));
            table.addCell(new PdfPCell(new Phrase(l.getCreatedAt() != null ? l.getCreatedAt().toString().substring(0, 10) : "", cellFont)));
        }

        document.add(table);
        document.close();
        return out.toByteArray();
    }
}
