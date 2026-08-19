using System.Text;
using ClosedXML.Excel;
using LeadGrowth.Data;
using LeadGrowth.DTOs;
using LeadGrowth.Models;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace LeadGrowth.Services;

public class ExportService : IExportService
{
    private readonly LeadGrowthDbContext _context;

    public ExportService(LeadGrowthDbContext context)
    {
        _context = context;
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public byte[] ExportCampaignsToCsv(List<Campaign> campaigns)
    {
        var sb = new StringBuilder();
        sb.AppendLine("ID,Name,Platform,Status,Budget,Spend,Leads,Conversions,Revenue,Created At");

        foreach (var c in campaigns)
        {
            sb.AppendLine($"\"{c.Id}\",\"{EscapeCsv(c.Name)}\",\"{EscapeCsv(c.Platform)}\",\"{EscapeCsv(c.Status ?? "ACTIVE")}\",\"{c.Budget}\",\"{c.Spend}\",\"{c.LeadsCount}\",\"{c.Conversions}\",\"{c.Revenue}\",\"{c.CreatedAt:yyyy-MM-dd HH:mm}\"");
        }

        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    public byte[] ExportCampaignsToExcel(List<Campaign> campaigns)
    {
        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Campaigns");

        worksheet.Cell(1, 1).Value = "ID";
        worksheet.Cell(1, 2).Value = "Name";
        worksheet.Cell(1, 3).Value = "Platform";
        worksheet.Cell(1, 4).Value = "Status";
        worksheet.Cell(1, 5).Value = "Budget ($)";
        worksheet.Cell(1, 6).Value = "Spend ($)";
        worksheet.Cell(1, 7).Value = "Leads";
        worksheet.Cell(1, 8).Value = "Conversions";
        worksheet.Cell(1, 9).Value = "Revenue ($)";
        worksheet.Cell(1, 10).Value = "Created At";

        var headerRow = worksheet.Row(1);
        headerRow.Style.Font.Bold = true;
        headerRow.Style.Fill.BackgroundColor = XLColor.FromHtml("#1E293B");
        headerRow.Style.Font.FontColor = XLColor.White;

        for (int i = 0; i < campaigns.Count; i++)
        {
            var c = campaigns[i];
            int row = i + 2;
            worksheet.Cell(row, 1).Value = c.Id;
            worksheet.Cell(row, 2).Value = c.Name;
            worksheet.Cell(row, 3).Value = c.Platform;
            worksheet.Cell(row, 4).Value = c.Status ?? "ACTIVE";
            worksheet.Cell(row, 5).Value = c.Budget;
            worksheet.Cell(row, 6).Value = c.Spend;
            worksheet.Cell(row, 7).Value = c.LeadsCount;
            worksheet.Cell(row, 8).Value = c.Conversions;
            worksheet.Cell(row, 9).Value = c.Revenue;
            worksheet.Cell(row, 10).Value = c.CreatedAt.ToString("yyyy-MM-dd HH:mm");
        }

        worksheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    public byte[] ExportCampaignsToPdf(List<Campaign> campaigns, string workspaceName)
    {
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4.Landscape());
                page.Margin(20);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontSize(10));

                page.Header().Text($"{workspaceName} — Campaigns Performance Summary")
                    .SemiBold().FontSize(16).FontColor(Colors.Blue.Darken2);

                page.Content().PaddingVertical(10).Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.ConstantColumn(30);
                        columns.RelativeColumn(2);
                        columns.RelativeColumn(1);
                        columns.RelativeColumn(1);
                        columns.RelativeColumn(1);
                        columns.RelativeColumn(1);
                        columns.RelativeColumn(1);
                    });

                    table.Header(header =>
                    {
                        header.Cell().Text("ID").Bold();
                        header.Cell().Text("Name").Bold();
                        header.Cell().Text("Platform").Bold();
                        header.Cell().Text("Status").Bold();
                        header.Cell().Text("Spend ($)").Bold();
                        header.Cell().Text("Leads").Bold();
                        header.Cell().Text("Revenue ($)").Bold();
                    });

                    foreach (var c in campaigns)
                    {
                        table.Cell().Text(c.Id.ToString());
                        table.Cell().Text(c.Name);
                        table.Cell().Text(c.Platform);
                        table.Cell().Text(c.Status ?? "ACTIVE");
                        table.Cell().Text(c.Spend.ToString("C2"));
                        table.Cell().Text(c.LeadsCount.ToString());
                        table.Cell().Text(c.Revenue.ToString("C2"));
                    }
                });

                page.Footer().AlignCenter().Text(x =>
                {
                    x.Span("Page ");
                    x.CurrentPageNumber();
                });
            });
        });

        return document.GeneratePdf();
    }

    public byte[] ExportLeadsToCsv(List<LeadDto> leads)
    {
        var sb = new StringBuilder();
        sb.AppendLine("ID,Name,Email,Phone,Company,Status,Source Platform,Quality Tier,Quality Score,Assigned To,Created At");

        foreach (var l in leads)
        {
            sb.AppendLine($"\"{l.Id}\",\"{EscapeCsv(l.Name)}\",\"{EscapeCsv(l.Email)}\",\"{EscapeCsv(l.Phone ?? "")}\",\"{EscapeCsv(l.Company ?? "")}\",\"{EscapeCsv(l.Status ?? "")}\",\"{EscapeCsv(l.SourcePlatform ?? "")}\",\"{EscapeCsv(l.QualityTier ?? "")}\",\"{l.QualityScore ?? 0}\",\"{EscapeCsv(l.AssignedToName ?? "")}\",\"{l.CreatedAt:yyyy-MM-dd HH:mm}\"");
        }

        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    public byte[] ExportLeadsToExcel(List<LeadDto> leads)
    {
        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Leads");

        worksheet.Cell(1, 1).Value = "ID";
        worksheet.Cell(1, 2).Value = "Name";
        worksheet.Cell(1, 3).Value = "Email";
        worksheet.Cell(1, 4).Value = "Phone";
        worksheet.Cell(1, 5).Value = "Company";
        worksheet.Cell(1, 6).Value = "Status";
        worksheet.Cell(1, 7).Value = "Source Platform";
        worksheet.Cell(1, 8).Value = "Quality Tier";
        worksheet.Cell(1, 9).Value = "Quality Score";
        worksheet.Cell(1, 10).Value = "Assigned To";
        worksheet.Cell(1, 11).Value = "Created At";

        var headerRow = worksheet.Row(1);
        headerRow.Style.Font.Bold = true;
        headerRow.Style.Fill.BackgroundColor = XLColor.FromHtml("#0F172A");
        headerRow.Style.Font.FontColor = XLColor.White;

        for (int i = 0; i < leads.Count; i++)
        {
            var l = leads[i];
            int row = i + 2;
            worksheet.Cell(row, 1).Value = l.Id;
            worksheet.Cell(row, 2).Value = l.Name;
            worksheet.Cell(row, 3).Value = l.Email;
            worksheet.Cell(row, 4).Value = l.Phone ?? "";
            worksheet.Cell(row, 5).Value = l.Company ?? "";
            worksheet.Cell(row, 6).Value = l.Status ?? "";
            worksheet.Cell(row, 7).Value = l.SourcePlatform ?? "";
            worksheet.Cell(row, 8).Value = l.QualityTier ?? "";
            worksheet.Cell(row, 9).Value = l.QualityScore ?? 0;
            worksheet.Cell(row, 10).Value = l.AssignedToName ?? "Unassigned";
            worksheet.Cell(row, 11).Value = l.CreatedAt.ToString("yyyy-MM-dd HH:mm");
        }

        worksheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    public byte[] ExportLeadsToPdf(List<LeadDto> leads, string workspaceName)
    {
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4.Landscape());
                page.Margin(20);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontSize(10));

                page.Header().Text($"{workspaceName} — Lead Portfolio Report")
                    .SemiBold().FontSize(16).FontColor(Colors.Indigo.Darken2);

                page.Content().PaddingVertical(10).Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.ConstantColumn(30);
                        columns.RelativeColumn(2);
                        columns.RelativeColumn(2);
                        columns.RelativeColumn(1.5f);
                        columns.RelativeColumn(1.5f);
                        columns.RelativeColumn(1.5f);
                        columns.RelativeColumn(2);
                    });

                    table.Header(header =>
                    {
                        header.Cell().Text("ID").Bold();
                        header.Cell().Text("Name").Bold();
                        header.Cell().Text("Email").Bold();
                        header.Cell().Text("Status").Bold();
                        header.Cell().Text("Priority").Bold();
                        header.Cell().Text("Score").Bold();
                        header.Cell().Text("Assigned Rep").Bold();
                    });

                    foreach (var l in leads)
                    {
                        table.Cell().Text(l.Id.ToString());
                        table.Cell().Text(l.Name);
                        table.Cell().Text(l.Email);
                        table.Cell().Text(l.Status ?? "New");
                        table.Cell().Text(l.Priority ?? "MEDIUM");
                        table.Cell().Text($"{l.QualityScore ?? 75} ({l.QualityTier ?? "WARM"})");
                        table.Cell().Text(l.AssignedToName ?? "Unassigned");
                    }
                });

                page.Footer().AlignCenter().Text(x =>
                {
                    x.Span("Page ");
                    x.CurrentPageNumber();
                });
            });
        });

        return document.GeneratePdf();
    }

    public byte[] ExportSingleLeadPdf(long leadId)
    {
        var lead = _context.Leads
            .Include(l => l.AssignedTo)
            .Include(l => l.Campaign)
            .FirstOrDefault(l => l.Id == leadId);

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(20);
                page.PageColor(Colors.White);

                page.Header().Text($"Lead Dossier #{leadId}: {lead?.Name ?? "Lead Record"}")
                    .Bold().FontSize(18).FontColor(Colors.Blue.Darken3);

                page.Content().PaddingVertical(10).Column(column =>
                {
                    column.Item().Text($"Name: {lead?.Name}");
                    column.Item().Text($"Email: {lead?.Email}");
                    column.Item().Text($"Phone: {lead?.Phone ?? "N/A"}");
                    column.Item().Text($"Company: {lead?.Company ?? "N/A"}");
                    column.Item().Text($"Status: {lead?.Status ?? "New"}");
                    column.Item().Text($"Priority: {lead?.Priority ?? "MEDIUM"}");
                    column.Item().Text($"Assigned Rep: {lead?.AssignedTo?.FullName ?? "Unassigned"}");
                    column.Item().Text($"Quality Tier: {lead?.QualityTier ?? "WARM"} ({lead?.QualityScore ?? 75} pts)");
                    column.Item().Text($"Client Notes: {lead?.ClientNotes ?? "None"}");
                });

                page.Footer().AlignRight().Text($"Generated: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC");
            });
        });

        return document.GeneratePdf();
    }

    private static string EscapeCsv(string val)
    {
        if (string.IsNullOrEmpty(val)) return string.Empty;
        return val.Replace("\"", "\"\"");
    }
}
