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
        var newCount = leads.Count(l => (l.Status ?? "New").Equals("New", StringComparison.OrdinalIgnoreCase));
        var interactionCount = leads.Count(l => (l.Status ?? "").Equals("Interaction", StringComparison.OrdinalIgnoreCase));
        var proposalCount = leads.Count(l => (l.Status ?? "").Equals("Proposal Sent", StringComparison.OrdinalIgnoreCase) || (l.Status ?? "").Equals("Proposal", StringComparison.OrdinalIgnoreCase));
        var negotiationCount = leads.Count(l => (l.Status ?? "").Equals("Negotiation", StringComparison.OrdinalIgnoreCase));
        var wonCount = leads.Count(l => (l.Status ?? "").Equals("Converted", StringComparison.OrdinalIgnoreCase) || (l.Status ?? "").Equals("Won", StringComparison.OrdinalIgnoreCase));
        var lostCount = leads.Count(l => (l.Status ?? "").Equals("Lost", StringComparison.OrdinalIgnoreCase));

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4.Landscape());
                page.Margin(24);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontSize(9).FontFamily(Fonts.Arial));

                page.Header().Column(col =>
                {
                    col.Item().Row(row =>
                    {
                        row.RelativeItem().Column(titleCol =>
                        {
                            titleCol.Item().Text($"{workspaceName} — Pipeline & Leads Report")
                                .Bold().FontSize(16).FontColor(Colors.Blue.Darken3);
                            titleCol.Item().Text($"Generated: {DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC • Total Portfolio: {leads.Count} Leads")
                                .FontSize(9).FontColor(Colors.Grey.Darken1);
                        });
                    });

                    // Stage-wise Executive Summary Cards
                    col.Item().PaddingTop(8).PaddingBottom(8).Row(row =>
                    {
                        row.Spacing(6);
                        row.RelativeItem().Border(1).BorderColor(Colors.Grey.Lighten2).Background(Colors.Grey.Lighten4).Padding(6).Column(c =>
                        {
                            c.Item().Text("NEW LEADS").FontSize(7).Bold().FontColor(Colors.Blue.Darken2);
                            c.Item().Text($"{newCount}").FontSize(12).Bold().FontColor(Colors.Blue.Darken3);
                        });
                        row.RelativeItem().Border(1).BorderColor(Colors.Grey.Lighten2).Background(Colors.Grey.Lighten4).Padding(6).Column(c =>
                        {
                            c.Item().Text("INTERACTION").FontSize(7).Bold().FontColor(Colors.Purple.Darken2);
                            c.Item().Text($"{interactionCount}").FontSize(12).Bold().FontColor(Colors.Purple.Darken3);
                        });
                        row.RelativeItem().Border(1).BorderColor(Colors.Grey.Lighten2).Background(Colors.Grey.Lighten4).Padding(6).Column(c =>
                        {
                            c.Item().Text("PROPOSALS").FontSize(7).Bold().FontColor(Colors.Cyan.Darken2);
                            c.Item().Text($"{proposalCount}").FontSize(12).Bold().FontColor(Colors.Cyan.Darken3);
                        });
                        row.RelativeItem().Border(1).BorderColor(Colors.Grey.Lighten2).Background(Colors.Grey.Lighten4).Padding(6).Column(c =>
                        {
                            c.Item().Text("NEGOTIATION").FontSize(7).Bold().FontColor(Colors.Orange.Darken2);
                            c.Item().Text($"{negotiationCount}").FontSize(12).Bold().FontColor(Colors.Orange.Darken3);
                        });
                        row.RelativeItem().Border(1).BorderColor(Colors.Grey.Lighten2).Background(Colors.Grey.Lighten4).Padding(6).Column(c =>
                        {
                            c.Item().Text("CONVERTED WON").FontSize(7).Bold().FontColor(Colors.Green.Darken2);
                            c.Item().Text($"{wonCount}").FontSize(12).Bold().FontColor(Colors.Green.Darken3);
                        });
                        row.RelativeItem().Border(1).BorderColor(Colors.Grey.Lighten2).Background(Colors.Grey.Lighten4).Padding(6).Column(c =>
                        {
                            c.Item().Text("LOST / CLOSED").FontSize(7).Bold().FontColor(Colors.Red.Darken2);
                            c.Item().Text($"{lostCount}").FontSize(12).Bold().FontColor(Colors.Red.Darken3);
                        });
                    });
                });

                page.Content().PaddingTop(4).Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.ConstantColumn(36);
                        columns.RelativeColumn(2.2f);
                        columns.RelativeColumn(2.2f);
                        columns.RelativeColumn(1.8f);
                        columns.RelativeColumn(1.6f);
                        columns.RelativeColumn(1.2f);
                        columns.RelativeColumn(1.4f);
                        columns.RelativeColumn(2f);
                    });

                    table.Header(header =>
                    {
                        header.Cell().Background(Colors.Blue.Darken3).Padding(5).Text("#ID").Bold().FontColor(Colors.White);
                        header.Cell().Background(Colors.Blue.Darken3).Padding(5).Text("Lead Name").Bold().FontColor(Colors.White);
                        header.Cell().Background(Colors.Blue.Darken3).Padding(5).Text("Email / Contact").Bold().FontColor(Colors.White);
                        header.Cell().Background(Colors.Blue.Darken3).Padding(5).Text("Company").Bold().FontColor(Colors.White);
                        header.Cell().Background(Colors.Blue.Darken3).Padding(5).Text("Stage Status").Bold().FontColor(Colors.White);
                        header.Cell().Background(Colors.Blue.Darken3).Padding(5).Text("Priority").Bold().FontColor(Colors.White);
                        header.Cell().Background(Colors.Blue.Darken3).Padding(5).Text("Quality").Bold().FontColor(Colors.White);
                        header.Cell().Background(Colors.Blue.Darken3).Padding(5).Text("Assigned Rep").Bold().FontColor(Colors.White);
                    });

                    for (int i = 0; i < leads.Count; i++)
                    {
                        var l = leads[i];
                        var bg = i % 2 == 0 ? Colors.White : Colors.Grey.Lighten4;

                        table.Cell().Background(bg).BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(4).Text(l.Id.ToString()).FontSize(8);
                        table.Cell().Background(bg).BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(4).Text(l.Name).Bold().FontSize(8);
                        table.Cell().Background(bg).BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(4).Text(l.Email).FontSize(8);
                        table.Cell().Background(bg).BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(4).Text(l.Company ?? "—").FontSize(8);
                        table.Cell().Background(bg).BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(4).Text(l.Status ?? "New").FontSize(8).Bold();
                        table.Cell().Background(bg).BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(4).Text(l.Priority ?? "MEDIUM").FontSize(8);
                        table.Cell().Background(bg).BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(4).Text($"{l.QualityTier ?? "WARM"} ({l.QualityScore ?? 75})").FontSize(8);
                        table.Cell().Background(bg).BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(4).Text(l.AssignedToName ?? "Unassigned").FontSize(8);
                    }
                });

                page.Footer().AlignCenter().Text(x =>
                {
                    x.Span("Hoossh Lead Growth Enterprise CRM • Page ");
                    x.CurrentPageNumber();
                    x.Span(" of ");
                    x.TotalPages();
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
                page.Margin(24);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontSize(10).FontFamily(Fonts.Arial));

                page.Header().Column(headerCol =>
                {
                    headerCol.Item().Row(r =>
                    {
                        r.RelativeItem().Column(c =>
                        {
                            c.Item().Text($"Lead Dossier: {lead?.Name ?? "Lead Record"}")
                                .Bold().FontSize(18).FontColor(Colors.Blue.Darken3);
                            c.Item().Text($"Lead ID #{leadId} • Generated: {DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC")
                                .FontSize(9).FontColor(Colors.Grey.Darken1);
                        });
                        r.AutoItem().Border(1).BorderColor(Colors.Blue.Lighten3).Background(Colors.Blue.Lighten5).Padding(6).Text(lead?.Status ?? "NEW")
                            .Bold().FontSize(12).FontColor(Colors.Blue.Darken3);
                    });
                    headerCol.Item().PaddingTop(8).LineHorizontal(1).LineColor(Colors.Grey.Lighten2);
                });

                page.Content().PaddingVertical(10).Column(column =>
                {
                    column.Spacing(12);

                    // Section 1: Contact Information Box
                    column.Item().Border(1).BorderColor(Colors.Grey.Lighten2).Background(Colors.Grey.Lighten5).Padding(10).Column(contactCol =>
                    {
                        contactCol.Item().Text("PRIMARY CONTACT INFORMATION").Bold().FontSize(9).FontColor(Colors.Blue.Darken2);
                        contactCol.Item().PaddingTop(4).Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.RelativeColumn();
                                columns.RelativeColumn();
                            });

                            table.Cell().PaddingVertical(2).Text($"Full Name: {lead?.Name ?? "N/A"}").Bold();
                            table.Cell().PaddingVertical(2).Text($"Email Address: {lead?.Email ?? "N/A"}");
                            table.Cell().PaddingVertical(2).Text($"Phone Number: {lead?.Phone ?? "N/A"}");
                            table.Cell().PaddingVertical(2).Text($"Company: {lead?.Company ?? "N/A"}");
                            table.Cell().PaddingVertical(2).Text($"Location: {lead?.Location ?? "N/A"}");
                            table.Cell().PaddingVertical(2).Text($"Source Platform: {lead?.SourcePlatform ?? "Meta Ads"}");
                        });
                    });

                    // Section 2: Pipeline & Quality Intelligence
                    column.Item().Border(1).BorderColor(Colors.Grey.Lighten2).Background(Colors.Grey.Lighten5).Padding(10).Column(pipelineCol =>
                    {
                        pipelineCol.Item().Text("SALES PIPELINE & ASSIGNMENT INTELLIGENCE").Bold().FontSize(9).FontColor(Colors.Blue.Darken2);
                        pipelineCol.Item().PaddingTop(4).Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.RelativeColumn();
                                columns.RelativeColumn();
                            });

                            table.Cell().PaddingVertical(2).Text($"Current Stage: {lead?.Status ?? "New"}").Bold();
                            table.Cell().PaddingVertical(2).Text($"Priority Level: {lead?.Priority ?? "MEDIUM"}");
                            table.Cell().PaddingVertical(2).Text($"Assigned Sales Rep: {lead?.AssignedTo?.FullName ?? "Unassigned"}").Bold();
                            table.Cell().PaddingVertical(2).Text($"Quality Tier: {lead?.QualityTier ?? "WARM"} ({lead?.QualityScore ?? 75} pts)");
                            table.Cell().PaddingVertical(2).Text($"Conversion Probability: {((lead?.ConversionProbability ?? 0.45) * 100):F1}%");
                            table.Cell().PaddingVertical(2).Text($"Workflow Progress: {lead?.ProgressPercentage ?? 0}%");
                        });
                    });

                    // Section 3: Notes & Discussion Summary
                    column.Item().Border(1).BorderColor(Colors.Grey.Lighten2).Background(Colors.Grey.Lighten5).Padding(10).Column(notesCol =>
                    {
                        notesCol.Item().Text("CLIENT NOTES & DISCUSSION LOGS").Bold().FontSize(9).FontColor(Colors.Blue.Darken2);
                        notesCol.Item().PaddingTop(4).Text(string.IsNullOrWhiteSpace(lead?.ClientNotes) ? "No detailed notes recorded for this lead yet." : lead.ClientNotes)
                            .FontSize(9).FontColor(Colors.Grey.Darken3);
                    });
                });

                page.Footer().AlignCenter().Text(x =>
                {
                    x.Span("Hoossh Lead Growth • Confidential CRM Record • Page ");
                    x.CurrentPageNumber();
                    x.Span(" of ");
                    x.TotalPages();
                });
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
