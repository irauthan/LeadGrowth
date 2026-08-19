using System.Security.Claims;
using LeadGrowth.DTOs;
using LeadGrowth.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LeadGrowth.Controllers;

[ApiController]
[Route("api/calls")]
[Authorize]
public class CallController : ControllerBase
{
    private readonly ICallService _callService;

    public CallController(ICallService callService)
    {
        _callService = callService;
    }

    [HttpPost("start")]
    public async Task<ActionResult<CallSessionDto>> StartCall([FromBody] Dictionary<string, object> payload)
    {
        var email = GetUserEmail();
        long leadId = long.Parse(payload["leadId"].ToString()!);
        try
        {
            var session = await _callService.StartCallAsync(leadId, email);
            return Ok(session);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("end")]
    public async Task<ActionResult<CallSessionDto>> EndCall([FromBody] Dictionary<string, object>? payload)
    {
        var email = GetUserEmail();
        long? callId = payload != null && payload.ContainsKey("callId") && payload["callId"] != null ? long.Parse(payload["callId"].ToString()!) : null;
        string? notes = payload != null && payload.ContainsKey("notes") && payload["notes"] != null ? payload["notes"].ToString() : "";

        try
        {
            var session = await _callService.EndCallAsync(callId, email, notes);
            return Ok(session);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("active")]
    public async Task<ActionResult<CallSessionDto?>> GetActiveCall()
    {
        var email = GetUserEmail();
        var session = await _callService.GetActiveCallAsync(email);
        return Ok(session);
    }

    [HttpGet("history/{leadId}")]
    public async Task<ActionResult<List<CallSessionDto>>> GetCallHistoryForLead(long leadId)
    {
        var list = await _callService.GetCallHistoryForLeadAsync(leadId);
        return Ok(list);
    }

    [HttpGet("user")]
    public async Task<ActionResult<CallAnalyticsDto>> GetUserCallAnalytics()
    {
        var email = GetUserEmail();
        var analytics = await _callService.GetUserCallAnalyticsAsync(email);
        return Ok(analytics);
    }

    [HttpGet("team")]
    public async Task<ActionResult<CallAnalyticsDto>> GetTeamCallAnalytics()
    {
        var email = GetUserEmail();
        var analytics = await _callService.GetTeamCallAnalyticsAsync(email);
        return Ok(analytics);
    }

    [HttpGet("dashboard")]
    public async Task<ActionResult<CallAnalyticsDto>> GetDashboardCallAnalytics()
    {
        return await GetUserCallAnalytics();
    }

    [HttpGet("analytics")]
    public async Task<ActionResult<CallAnalyticsDto>> GetAnalytics()
    {
        return await GetTeamCallAnalytics();
    }

    [HttpGet("reports")]
    public async Task<ActionResult<List<CallSessionDto>>> GetCallReports([FromQuery] long? userId, [FromQuery] string? startDate, [FromQuery] string? endDate)
    {
        var email = GetUserEmail();
        var list = await _callService.GetCallReportsAsync(email, userId, startDate, endDate);
        return Ok(list);
    }

    private string GetUserEmail()
    {
        return User.FindFirstValue(ClaimTypes.Name) ?? User.FindFirstValue(ClaimTypes.Email) ?? string.Empty;
    }
}
