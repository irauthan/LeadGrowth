using System.Security.Claims;
using LeadGrowth.DTOs;
using LeadGrowth.Models;
using LeadGrowth.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LeadGrowth.Controllers;

[ApiController]
[Route("api/leads")]
[Authorize]
public class LeadController : ControllerBase
{
    private readonly ILeadService _leadService;

    public LeadController(ILeadService leadService)
    {
        _leadService = leadService;
    }

    [HttpGet("contacts")]
    public async Task<ActionResult<List<ContactRepoDto>>> GetContactsRepository()
    {
        var email = GetUserEmail();
        var contacts = await _leadService.GetContactsRepositoryAsync(email);
        return Ok(contacts);
    }

    [HttpGet]
    public async Task<ActionResult<List<LeadDto>>> GetLeads(
        [FromQuery] string? period,
        [FromQuery] string? startDate,
        [FromQuery] string? endDate)
    {
        var email = GetUserEmail();
        try
        {
            var leads = await _leadService.GetLeadsAsync(email, period, startDate, endDate);
            return Ok(leads);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("high-priority")]
    public async Task<ActionResult<List<LeadDto>>> GetHighPriorityLeads()
    {
        var email = GetUserEmail();
        var leads = await _leadService.GetHighPriorityLeadsAsync(email);
        return Ok(leads);
    }

    [HttpGet("new")]
    public async Task<ActionResult<List<LeadDto>>> GetNewLeadsToday()
    {
        var email = GetUserEmail();
        var leads = await _leadService.GetNewLeadsTodayAsync(email);
        return Ok(leads);
    }

    [HttpGet("negotiation")]
    public async Task<ActionResult<List<LeadDto>>> GetNegotiationLeads()
    {
        var email = GetUserEmail();
        var leads = await _leadService.GetNegotiationLeadsAsync(email);
        return Ok(leads);
    }

    [HttpPost]
    public async Task<ActionResult<LeadDto>> CreateLead([FromBody] LeadDto dto)
    {
        var email = GetUserEmail();
        try
        {
            var lead = await _leadService.CreateLeadAsync(dto, email);
            return Ok(lead);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<LeadDto>> GetLeadById(long id)
    {
        try
        {
            var lead = await _leadService.GetLeadByIdAsync(id);
            return Ok(lead);
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPatch("{id}/status")]
    public async Task<ActionResult<LeadDto>> UpdateStatus(long id, [FromQuery] string status)
    {
        var email = GetUserEmail();
        try
        {
            var lead = await _leadService.UpdateStatusAsync(id, status, email);
            return Ok(lead);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPatch("{id}/assign")]
    [Authorize(Policy = "RequireUser")]
    public async Task<ActionResult<LeadDto>> AssignLead(long id, [FromQuery] long userId)
    {
        var email = GetUserEmail();
        try
        {
            var lead = await _leadService.AssignLeadAsync(id, userId, email);
            return Ok(lead);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id}/notes")]
    public async Task<IActionResult> AddNote(long id, [FromBody] LeadNoteRequest request)
    {
        var email = GetUserEmail();
        try
        {
            await _leadService.AddNoteAsync(id, request, email);
            return Ok();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("{id}/notes")]
    public async Task<ActionResult<List<LeadNote>>> GetNotes(long id)
    {
        var notes = await _leadService.GetNotesAsync(id);
        return Ok(notes);
    }

    [HttpPost("bulk-assign")]
    [Authorize(Policy = "RequireManagerOrAdmin")]
    public async Task<ActionResult<List<LeadDto>>> BulkAssign([FromQuery] List<long> leadIds, [FromQuery] long userId)
    {
        var email = GetUserEmail();
        var leads = await _leadService.BulkAssignLeadsAsync(leadIds, userId, email);
        return Ok(leads);
    }

    [HttpPost("bulk-random-assign")]
    [Authorize(Policy = "RequireManagerOrAdmin")]
    public async Task<ActionResult<List<LeadDto>>> BulkRandomAssign([FromQuery] List<long> leadIds)
    {
        var email = GetUserEmail();
        var leads = await _leadService.BulkRandomAssignLeadsAsync(leadIds, email);
        return Ok(leads);
    }

    [HttpPost("bulk-status")]
    public async Task<ActionResult<List<LeadDto>>> BulkStatus([FromQuery] List<long> leadIds, [FromQuery] string status)
    {
        var email = GetUserEmail();
        var leads = await _leadService.BulkUpdateLeadStatusAsync(leadIds, status, email);
        return Ok(leads);
    }

    [HttpPost("{id}/auto-assign")]
    [Authorize(Policy = "RequireManagerOrAdmin")]
    public async Task<ActionResult<LeadDto>> AutoAssignLead(long id)
    {
        var email = GetUserEmail();
        try
        {
            var lead = await _leadService.AssignLeadAsync(id, -1, email);
            return Ok(lead);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("workspace")]
    public async Task<ActionResult<List<LeadDto>>> GetWorkspaceLeads()
    {
        var email = GetUserEmail();
        try
        {
            var leads = await _leadService.GetLeadsAsync(email);
            return Ok(leads);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id}/add-to-pipeline")]
    [Authorize(Policy = "RequireUser")]
    public async Task<ActionResult<LeadDto>> AddToPipeline(long id)
    {
        var email = GetUserEmail();
        try
        {
            var lead = await _leadService.AddToPipelineAsync(id, email);
            return Ok(lead);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("pipeline")]
    [Authorize(Policy = "RequireUser")]
    public async Task<ActionResult<List<LeadDto>>> GetPipelineLeads()
    {
        var email = GetUserEmail();
        try
        {
            var leads = await _leadService.GetPipelineLeadsAsync(email);
            return Ok(leads);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("pending-assigned")]
    [Authorize(Policy = "RequireUser")]
    public async Task<ActionResult<List<LeadDto>>> GetPendingAssignedLeads()
    {
        var email = GetUserEmail();
        var leads = await _leadService.GetPendingAssignedLeadsAsync(email);
        return Ok(leads);
    }

    [HttpPatch("{id}/activity")]
    public async Task<ActionResult<LeadDto>> UpdateActivity(long id, [FromQuery] string activityKey, [FromQuery] string status, [FromQuery] string? remarks)
    {
        var email = GetUserEmail();
        try
        {
            var lead = await _leadService.UpdateLeadActivityAsync(id, activityKey, status, remarks, email);
            return Ok(lead);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id}/workflow-steps/{activityKey}/activities")]
    public async Task<ActionResult<LeadDto>> AddStepActivityLog(long id, string activityKey, [FromBody] AddActivityLogRequest request)
    {
        var email = GetUserEmail();
        try
        {
            var lead = await _leadService.AddStepActivityLogAsync(id, activityKey, request, email);
            return Ok(lead);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id}/workflow-steps/{activityKey}/complete")]
    public async Task<ActionResult<LeadDto>> CompleteWorkflowStep(long id, string activityKey, [FromBody] CompleteStepRequest? request)
    {
        var email = GetUserEmail();
        try
        {
            var lead = await _leadService.CompleteWorkflowStepAsync(id, activityKey, request, email);
            return Ok(lead);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("{id}/activities-history")]
    public async Task<ActionResult<List<SalesActivityLogDto>>> GetLeadActivityHistory(long id)
    {
        var logs = await _leadService.GetLeadActivityLogsAsync(id);
        return Ok(logs);
    }

    [HttpGet("workflow-pending-counts")]
    public async Task<ActionResult<Dictionary<string, int>>> GetWorkflowPendingCounts()
    {
        var email = GetUserEmail();
        var counts = await _leadService.GetWorkflowPendingCountsAsync(email);
        return Ok(counts);
    }

    [HttpPatch("{id}/auto-save")]
    public async Task<ActionResult<LeadDto>> AutoSaveWorkspaceLead(long id, [FromBody] LeadDto dto)
    {
        var email = GetUserEmail();
        try
        {
            var lead = await _leadService.UpdateLeadWorkspaceAsync(id, dto, email);
            return Ok(lead);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("{id}/timeline")]
    public async Task<ActionResult<List<LeadHistoryDto>>> GetLeadTimeline(long id)
    {
        var timeline = await _leadService.GetLeadTimelineAsync(id);
        return Ok(timeline);
    }

    private string GetUserEmail()
    {
        return User.FindFirstValue(ClaimTypes.Name) ?? User.FindFirstValue(ClaimTypes.Email) ?? string.Empty;
    }
}
