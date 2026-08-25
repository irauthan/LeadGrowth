using System.Security.Claims;
using LeadGrowth.Data;
using LeadGrowth.DTOs;
using LeadGrowth.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LeadGrowth.Controllers;

[ApiController]
[Route("api/bulk-assignment")]
[Authorize(Policy = "RequireManagerOrAdmin")]
public class BulkAssignmentController : ControllerBase
{
    private readonly IBulkAssignmentService _bulkService;
    private readonly LeadGrowthDbContext _context;

    public BulkAssignmentController(IBulkAssignmentService bulkService, LeadGrowthDbContext context)
    {
        _bulkService = bulkService;
        _context = context;
    }

    [HttpPost("preview")]
    public async Task<ActionResult<BulkAssignPreviewResponse>> PreviewAutoAssign([FromBody] BulkAssignPreviewRequest request)
    {
        var email = GetUserEmail();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null || !user.WorkspaceId.HasValue) return Unauthorized();

        var preview = await _bulkService.PreviewAutoAssignAsync(request.LeadIds, user.WorkspaceId.Value, email);
        return Ok(preview);
    }

    [HttpPost("auto-assign")]
    public async Task<ActionResult<BulkAssignExecutionResult>> ExecuteAutoAssign([FromBody] BulkAutoAssignRequest request)
    {
        var email = GetUserEmail();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null || !user.WorkspaceId.HasValue) return Unauthorized();

        try
        {
            var result = await _bulkService.ExecuteBulkAutoAssignAsync(request.LeadIds, user.WorkspaceId.Value, email);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("manual-assign")]
    public async Task<ActionResult<BulkAssignExecutionResult>> ExecuteManualAssign([FromBody] BulkManualAssignRequest request)
    {
        var email = GetUserEmail();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null || !user.WorkspaceId.HasValue) return Unauthorized();

        try
        {
            var result = await _bulkService.ExecuteBulkManualAssignAsync(request.LeadIds, request.TargetUserId, user.WorkspaceId.Value, request.OverrideReason, email);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("schedule")]
    public async Task<ActionResult<BulkAssignmentJobDto>> ScheduleJob([FromBody] BulkScheduleJobRequest request)
    {
        var email = GetUserEmail();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null || !user.WorkspaceId.HasValue) return Unauthorized();

        try
        {
            var job = await _bulkService.CreateScheduledJobAsync(request, user.WorkspaceId.Value, email);
            return Ok(job);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("jobs")]
    public async Task<ActionResult<List<BulkAssignmentJobDto>>> GetJobs()
    {
        var email = GetUserEmail();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null || !user.WorkspaceId.HasValue) return Unauthorized();

        var jobs = await _bulkService.GetScheduledJobsAsync(user.WorkspaceId.Value, email);
        return Ok(jobs);
    }

    [HttpDelete("jobs/{id}")]
    public async Task<IActionResult> CancelJob(long id)
    {
        var email = GetUserEmail();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null || !user.WorkspaceId.HasValue) return Unauthorized();

        try
        {
            await _bulkService.CancelScheduledJobAsync(id, user.WorkspaceId.Value, email);
            return Ok(new { message = "Scheduled bulk assignment job cancelled successfully." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    private string GetUserEmail()
    {
        return User.FindFirstValue(ClaimTypes.Name) ?? User.FindFirstValue(ClaimTypes.Email) ?? string.Empty;
    }
}
