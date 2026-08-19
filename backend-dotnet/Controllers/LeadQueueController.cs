using System.Security.Claims;
using LeadGrowth.Data;
using LeadGrowth.DTOs;
using LeadGrowth.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LeadGrowth.Controllers;

[ApiController]
[Route("api/leads/queue")]
[Authorize]
public class LeadQueueController : ControllerBase
{
    private readonly ILeadQueueService _leadQueueService;
    private readonly LeadGrowthDbContext _context;

    public LeadQueueController(ILeadQueueService leadQueueService, LeadGrowthDbContext context)
    {
        _leadQueueService = leadQueueService;
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<LeadDto>>> GetQueue()
    {
        var email = GetUserEmail();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null || user.WorkspaceId == null)
        {
            return BadRequest(new { message = "User workspace not found" });
        }

        var queue = await _leadQueueService.GetUnassignedLeadQueueAsync(user.WorkspaceId.Value);
        return Ok(queue);
    }

    [HttpPost("bulk-assign")]
    public async Task<ActionResult<List<LeadDto>>> BulkAssignLeads([FromBody] BulkAssignPayload payload)
    {
        var email = GetUserEmail();
        try
        {
            var assigned = await _leadQueueService.BulkAssignLeadsAsync(payload.LeadIds, payload.TargetUserId, email);
            return Ok(assigned);
        }
        catch (KeyNotFoundException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id}/auto-assign")]
    public async Task<ActionResult<LeadDto>> AutoAssignLead(long id)
    {
        var email = GetUserEmail();
        try
        {
            var lead = await _leadQueueService.AutoAssignLeadAsync(id, email);
            return Ok(lead);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost("idle-sweep")]
    public async Task<ActionResult<LeadDto>> TriggerIdleSweep()
    {
        var email = GetUserEmail();
        try
        {
            var assignedLead = await _leadQueueService.TriggerIdlePreventionSweepAsync(email);
            if (assignedLead != null)
            {
                return Ok(assignedLead);
            }
            else
            {
                return NoContent();
            }
        }
        catch (KeyNotFoundException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    private string GetUserEmail()
    {
        return User.FindFirstValue(ClaimTypes.Name) ?? User.FindFirstValue(ClaimTypes.Email) ?? string.Empty;
    }
}
