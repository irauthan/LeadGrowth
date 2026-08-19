using System.ComponentModel.DataAnnotations;

namespace LeadGrowth.DTOs;

public class DailyReportSubmitRequest
{
    public string? Period { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public string? Notes { get; set; }
}

public class ReportReviewRequest
{
    [Required]
    public string Status { get; set; } = "APPROVED"; // APPROVED, REJECTED
    public string? ReviewComments { get; set; }
}

public class ReportDto
{
    public long Id { get; set; }
    public long WorkspaceId { get; set; }
    public long UserId { get; set; }
    public string? UserName { get; set; }
    public string ReportType { get; set; } = "DAILY_SALES";
    public string? Period { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public string Status { get; set; } = "PENDING";
    public long? ReviewedById { get; set; }
    public string? ReviewedByName { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? ReviewComments { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}
