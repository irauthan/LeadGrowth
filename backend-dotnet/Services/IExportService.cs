using LeadGrowth.DTOs;
using LeadGrowth.Models;

namespace LeadGrowth.Services;

public interface IExportService
{
    byte[] ExportCampaignsToCsv(List<Campaign> campaigns);
    byte[] ExportCampaignsToExcel(List<Campaign> campaigns);
    byte[] ExportCampaignsToPdf(List<Campaign> campaigns, string workspaceName);
    byte[] ExportLeadsToCsv(List<LeadDto> leads);
    byte[] ExportLeadsToExcel(List<LeadDto> leads);
    byte[] ExportLeadsToPdf(List<LeadDto> leads, string workspaceName);
    byte[] ExportSingleLeadPdf(long leadId);
}
