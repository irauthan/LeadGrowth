using LeadGrowth.DTOs;
using LeadGrowth.Models;

namespace LeadGrowth.Services;

public interface IReportService
{
    Task<ReportDto> SubmitDailyReportAsync(DailyReportSubmitRequest request, string email);
    Task<List<ReportDto>> GetUserReportsAsync(string email);
    Task<List<ReportDto>> GetPendingWorkspaceReportsAsync(string email);
    Task<ReportDto> ReviewReportAsync(long id, ReportReviewRequest request, string email);
    Task LogReportExportAsync(Workspace workspace, User user, string? period, string? startDate, string? endDate, string exportFormat, string reportType, string fileName, string recordsExported);
}
