using System.Security.Claims;
using LeadGrowth.DTOs;
using LeadGrowth.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LeadGrowth.Controllers;

[ApiController]
[Route("api/reports")]
[Authorize]
public class ReportController : ControllerBase
{
    private readonly IReportService _reportService;
    private readonly IExportService _exportService;
    private readonly ICampaignService _campaignService;
    private readonly ILeadService _leadService;
    private readonly IWorkspaceService _workspaceService;

    public ReportController(
        IReportService reportService,
        IExportService exportService,
        ICampaignService campaignService,
        ILeadService leadService,
        IWorkspaceService workspaceService)
    {
        _reportService = reportService;
        _exportService = exportService;
        _campaignService = campaignService;
        _leadService = leadService;
        _workspaceService = workspaceService;
    }

    [HttpPost("daily")]
    public async Task<ActionResult<ReportDto>> SubmitDailyReport([FromBody] DailyReportSubmitRequest request)
    {
        var email = GetUserEmail();
        try
        {
            var report = await _reportService.SubmitDailyReportAsync(request, email);
            return Ok(report);
        }
        catch (KeyNotFoundException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("my-reports")]
    public async Task<ActionResult<List<ReportDto>>> GetMyReports()
    {
        var email = GetUserEmail();
        var reports = await _reportService.GetUserReportsAsync(email);
        return Ok(reports);
    }

    [HttpGet("workspace-reports")]
    [Authorize(Policy = "RequireManagerOrAdmin")]
    public async Task<ActionResult<List<ReportDto>>> GetWorkspaceReports()
    {
        var email = GetUserEmail();
        var reports = await _reportService.GetPendingWorkspaceReportsAsync(email);
        return Ok(reports);
    }

    [HttpPatch("{id}/review")]
    [Authorize(Policy = "RequireManagerOrAdmin")]
    public async Task<ActionResult<ReportDto>> ReviewReport(long id, [FromBody] ReportReviewRequest request)
    {
        var email = GetUserEmail();
        try
        {
            var report = await _reportService.ReviewReportAsync(id, request, email);
            return Ok(report);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // --- Campaign Export Endpoints ---

    [HttpGet("campaigns/csv")]
    public async Task<IActionResult> DownloadCampaignsCsv([FromQuery] string? period, [FromQuery] string? startDate, [FromQuery] string? endDate)
    {
        var email = GetUserEmail();
        var campaigns = await _campaignService.GetCampaignsAsync(email);
        var data = _exportService.ExportCampaignsToCsv(campaigns);
        return File(data, "text/csv", "campaigns.csv");
    }

    [HttpGet("campaigns/excel")]
    public async Task<IActionResult> DownloadCampaignsExcel([FromQuery] string? period, [FromQuery] string? startDate, [FromQuery] string? endDate)
    {
        var email = GetUserEmail();
        var campaigns = await _campaignService.GetCampaignsAsync(email);
        var data = _exportService.ExportCampaignsToExcel(campaigns);
        return File(data, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "campaigns.xlsx");
    }

    [HttpGet("campaigns/pdf")]
    public async Task<IActionResult> DownloadCampaignsPdf([FromQuery] string? period, [FromQuery] string? startDate, [FromQuery] string? endDate)
    {
        var email = GetUserEmail();
        var campaigns = await _campaignService.GetCampaignsAsync(email);
        var workspace = await _workspaceService.GetCurrentWorkspaceAsync(email);
        var data = _exportService.ExportCampaignsToPdf(campaigns, workspace.Name);
        return File(data, "application/pdf", "campaigns.pdf");
    }

    // --- Lead Export Endpoints ---
 
    [HttpGet("leads/csv")]
    public async Task<IActionResult> DownloadLeadsCsv([FromQuery] string? period, [FromQuery] string? startDate, [FromQuery] string? endDate, [FromQuery] long? userId)
    {
        var email = GetUserEmail();
        var leads = await _leadService.GetLeadsAsync(email, period, startDate, endDate, userId);
        var data = _exportService.ExportLeadsToCsv(leads);
        return File(data, "text/csv", "leads.csv");
    }

    [HttpGet("leads/excel")]
    public async Task<IActionResult> DownloadLeadsExcel([FromQuery] string? period, [FromQuery] string? startDate, [FromQuery] string? endDate, [FromQuery] long? userId)
    {
        var email = GetUserEmail();
        var leads = await _leadService.GetLeadsAsync(email, period, startDate, endDate, userId);
        var data = _exportService.ExportLeadsToExcel(leads);
        return File(data, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "leads.xlsx");
    }

    [HttpGet("leads/pdf")]
    public async Task<IActionResult> DownloadLeadsPdf([FromQuery] string? period, [FromQuery] string? startDate, [FromQuery] string? endDate, [FromQuery] long? userId)
    {
        var email = GetUserEmail();
        var leads = await _leadService.GetLeadsAsync(email, period, startDate, endDate, userId);
        var workspace = await _workspaceService.GetCurrentWorkspaceAsync(email);
        var data = _exportService.ExportLeadsToPdf(leads, workspace.Name);
        return File(data, "application/pdf", "leads.pdf");
    }

    [HttpGet("leads/{id}/pdf")]
    public IActionResult DownloadSingleLeadPdf(long id)
    {
        var data = _exportService.ExportSingleLeadPdf(id);
        return File(data, "application/pdf", $"lead_{id}_dossier.pdf");
    }

    private string GetUserEmail()
    {
        return User.FindFirstValue(ClaimTypes.Name) ?? User.FindFirstValue(ClaimTypes.Email) ?? string.Empty;
    }
}
