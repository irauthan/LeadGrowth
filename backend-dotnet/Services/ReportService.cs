using LeadGrowth.Data;
using LeadGrowth.DTOs;
using LeadGrowth.Models;
using Microsoft.EntityFrameworkCore;

namespace LeadGrowth.Services;

public class ReportService : IReportService
{
    private readonly LeadGrowthDbContext _context;

    public ReportService(LeadGrowthDbContext context)
    {
        _context = context;
    }

    public async Task<ReportDto> SubmitDailyReportAsync(DailyReportSubmitRequest request, string email)
    {
        var userEmail = email.Trim().ToLower();
        var user = await _context.Users
            .Include(u => u.Workspace)
            .FirstOrDefaultAsync(u => u.Email == userEmail);

        if (user == null || user.WorkspaceId == null)
        {
            throw new KeyNotFoundException("User workspace not found");
        }

        var report = new Report
        {
            WorkspaceId = user.WorkspaceId.Value,
            Workspace = user.Workspace!,
            UserId = user.Id,
            User = user,
            ReportType = "DAILY_SALES",
            Period = request.Period ?? "DAILY",
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            Notes = request.Notes,
            Status = "PENDING",
            CreatedAt = DateTime.UtcNow
        };

        _context.Reports.Add(report);
        await _context.SaveChangesAsync();

        return ConvertToDto(report);
    }

    public async Task<List<ReportDto>> GetUserReportsAsync(string email)
    {
        var userEmail = email.Trim().ToLower();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == userEmail);
        if (user == null)
        {
            throw new KeyNotFoundException("User not found");
        }

        var reports = await _context.Reports
            .Include(r => r.User)
            .Include(r => r.ReviewedBy)
            .Where(r => r.UserId == user.Id)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        return reports.Select(ConvertToDto).ToList();
    }

    public async Task<List<ReportDto>> GetPendingWorkspaceReportsAsync(string email)
    {
        var userEmail = email.Trim().ToLower();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == userEmail);
        if (user == null || user.WorkspaceId == null)
        {
            throw new KeyNotFoundException("User workspace not found");
        }

        var reports = await _context.Reports
            .Include(r => r.User)
            .Include(r => r.ReviewedBy)
            .Where(r => r.WorkspaceId == user.WorkspaceId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        return reports.Select(ConvertToDto).ToList();
    }

    public async Task<ReportDto> ReviewReportAsync(long id, ReportReviewRequest request, string email)
    {
        var userEmail = email.Trim().ToLower();
        var reviewer = await _context.Users.FirstOrDefaultAsync(u => u.Email == userEmail);
        if (reviewer == null)
        {
            throw new KeyNotFoundException("Reviewer not found");
        }

        var report = await _context.Reports
            .Include(r => r.User)
            .Include(r => r.ReviewedBy)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (report == null)
        {
            throw new ArgumentException("Report not found");
        }

        report.Status = request.Status.ToUpper();
        report.ReviewedById = reviewer.Id;
        report.ReviewedBy = reviewer;
        report.ReviewedAt = DateTime.UtcNow;
        report.ReviewComments = request.ReviewComments;

        await _context.SaveChangesAsync();
        return ConvertToDto(report);
    }

    public async Task LogReportExportAsync(Workspace workspace, User user, string? period, string? startDate, string? endDate, string exportFormat, string reportType, string fileName, string recordsExported)
    {
        DateOnly? start = null, end = null;
        if (DateOnly.TryParse(startDate, out var dStart)) start = dStart;
        if (DateOnly.TryParse(endDate, out var dEnd)) end = dEnd;

        var history = new ReportHistory
        {
            WorkspaceId = workspace.Id,
            Workspace = workspace,
            UserId = user.Id,
            User = user,
            Period = period ?? "CUSTOM",
            StartDate = start,
            EndDate = end,
            ExportFormat = exportFormat,
            ReportType = reportType,
            FileName = fileName,
            RecordsExported = recordsExported,
            ExportedAt = DateTime.UtcNow
        };

        _context.ReportHistories.Add(history);
        await _context.SaveChangesAsync();
    }

    private static ReportDto ConvertToDto(Report r)
    {
        return new ReportDto
        {
            Id = r.Id,
            WorkspaceId = r.WorkspaceId,
            UserId = r.UserId,
            UserName = r.User != null ? r.User.FullName : "Unknown",
            ReportType = r.ReportType,
            Period = r.Period,
            StartDate = r.StartDate,
            EndDate = r.EndDate,
            Status = r.Status,
            ReviewedById = r.ReviewedById,
            ReviewedByName = r.ReviewedBy != null ? r.ReviewedBy.FullName : null,
            ReviewedAt = r.ReviewedAt,
            ReviewComments = r.ReviewComments,
            Notes = r.Notes,
            CreatedAt = r.CreatedAt
        };
    }
}
