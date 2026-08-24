using System.Security.Claims;
using LeadGrowth.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LeadGrowth.Controllers;

[ApiController]
[Route("api/followups")]
[Authorize]
public class FollowupController : ControllerBase
{
    private readonly IFollowupService _followupService;

    public FollowupController(IFollowupService followupService)
    {
        _followupService = followupService;
    }

    [HttpGet]
    public async Task<ActionResult<List<Dictionary<string, object>>>> GetFollowups()
    {
        var email = GetUserEmail();
        var list = await _followupService.GetFollowupsAsync(email);
        return Ok(list);
    }

    [HttpGet("today")]
    public async Task<ActionResult<List<Dictionary<string, object>>>> GetTodayFollowups()
    {
        var email = GetUserEmail();
        var list = await _followupService.GetTodayFollowupsAsync(email);
        return Ok(list);
    }

    [HttpGet("check-conflict")]
    public async Task<ActionResult<Dictionary<string, object>>> CheckConflict([FromQuery] long userId, [FromQuery] string scheduledAt, [FromQuery] long? excludeId)
    {
        var res = await _followupService.CheckConflictAsync(userId, scheduledAt, excludeId);
        return Ok(res);
    }

    [HttpPost]
    public async Task<ActionResult<Dictionary<string, object>>> CreateFollowup([FromBody] Dictionary<string, object> payload)
    {
        var email = GetUserEmail();
        long leadId = long.Parse(payload["leadId"].ToString()!);
        string scheduledAt = payload.ContainsKey("scheduledAt") && payload["scheduledAt"] != null ? payload["scheduledAt"].ToString()! : (payload.ContainsKey("nextFollowupDate") && payload["nextFollowupDate"] != null ? payload["nextFollowupDate"].ToString()! : DateTime.UtcNow.AddHours(24).ToString("o"));
        string type = payload.ContainsKey("type") && payload["type"] != null ? payload["type"].ToString()! : (payload.ContainsKey("communicationType") && payload["communicationType"] != null ? payload["communicationType"].ToString()! : "CALL");
        string notes = payload.ContainsKey("notes") && payload["notes"] != null ? payload["notes"].ToString()! : "";
        string? outcome = payload.ContainsKey("outcome") && payload["outcome"] != null ? payload["outcome"].ToString() : null;
        string? nextFollowupDate = payload.ContainsKey("nextFollowupDate") && payload["nextFollowupDate"] != null ? payload["nextFollowupDate"].ToString() : null;
        string? remarks = payload.ContainsKey("remarks") && payload["remarks"] != null ? payload["remarks"].ToString() : notes;
        bool autoScheduleIfConflict = payload.ContainsKey("autoScheduleIfConflict") && bool.TryParse(payload["autoScheduleIfConflict"].ToString(), out var b) && b;

        var res = await _followupService.CreateFollowupAsync(leadId, email, scheduledAt, type, notes, outcome, nextFollowupDate, remarks, autoScheduleIfConflict);
        return Ok(res);
    }

    [HttpPost("auto-schedule")]
    public async Task<ActionResult<Dictionary<string, object>>> AutoScheduleFollowup([FromBody] Dictionary<string, object> payload)
    {
        var email = GetUserEmail();
        long leadId = long.Parse(payload["leadId"].ToString()!);
        string type = payload.ContainsKey("type") && payload["type"] != null ? payload["type"].ToString()! : "CALL";
        string notes = payload.ContainsKey("notes") && payload["notes"] != null ? payload["notes"].ToString()! : "Auto-scheduled follow-up";

        var res = await _followupService.AutoScheduleFollowupAsync(leadId, email, type, notes);
        return Ok(res);
    }

    [HttpPost("bulk-auto-schedule")]
    public async Task<ActionResult<List<Dictionary<string, object>>>> BulkAutoSchedule([FromBody] Dictionary<string, object> payload)
    {
        var email = GetUserEmail();
        var rawIds = payload["leadIds"] as System.Text.Json.JsonElement?;
        var leadIds = new List<long>();
        if (rawIds.HasValue && rawIds.Value.ValueKind == System.Text.Json.JsonValueKind.Array)
        {
            foreach (var item in rawIds.Value.EnumerateArray())
            {
                leadIds.Add(item.GetInt64());
            }
        }

        var res = await _followupService.BulkAutoScheduleAsync(email, leadIds);
        return Ok(res);
    }

    [HttpPost("{id}/reschedule")]
    public async Task<ActionResult<Dictionary<string, object>>> RescheduleFollowup(long id, [FromBody] Dictionary<string, object> payload)
    {
        var email = GetUserEmail();
        string newScheduledAt = payload["scheduledAt"].ToString()!;
        bool autoScheduleIfConflict = payload.ContainsKey("autoScheduleIfConflict") && bool.TryParse(payload["autoScheduleIfConflict"].ToString(), out var b) && b;

        var res = await _followupService.RescheduleFollowupAsync(id, email, newScheduledAt, autoScheduleIfConflict);
        return Ok(res);
    }

    [HttpPost("{id}/cancel")]
    public async Task<ActionResult<Dictionary<string, object>>> CancelFollowup(long id, [FromBody] Dictionary<string, object>? payload)
    {
        var email = GetUserEmail();
        string reason = payload != null && payload.ContainsKey("reason") && payload["reason"] != null ? payload["reason"].ToString()! : "Cancelled by user";

        var res = await _followupService.CancelFollowupAsync(id, email, reason);
        return Ok(res);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<Dictionary<string, object>>> DeleteFollowup(long id)
    {
        var email = GetUserEmail();
        var res = await _followupService.CancelFollowupAsync(id, email, "Cancelled and removed by user");
        return Ok(res);
    }

    [HttpPost("{id}/reassign")]
    public async Task<ActionResult<Dictionary<string, object>>> ReassignFollowup(long id, [FromBody] Dictionary<string, object> payload)
    {
        long newUserId = long.Parse(payload["newUserId"].ToString()!);
        string? newScheduledAt = payload.ContainsKey("scheduledAt") && payload["scheduledAt"] != null ? payload["scheduledAt"].ToString() : null;

        var res = await _followupService.ReassignFollowupAsync(id, newUserId, newScheduledAt);
        return Ok(res);
    }

    [HttpPost("{id}/complete")]
    public async Task<ActionResult<Dictionary<string, object>>> CompleteFollowup(long id, [FromBody] Dictionary<string, object>? payload)
    {
        var email = GetUserEmail();
        string notes = payload != null && payload.ContainsKey("notes") && payload["notes"] != null ? payload["notes"].ToString()! : "";

        var res = await _followupService.CompleteFollowupAsync(id, email, notes);
        return Ok(res);
    }

    private string GetUserEmail()
    {
        return User.FindFirstValue(ClaimTypes.Name) ?? User.FindFirstValue(ClaimTypes.Email) ?? string.Empty;
    }
}
