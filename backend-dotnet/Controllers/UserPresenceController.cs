using System.Security.Claims;
using LeadGrowth.Data;
using LeadGrowth.DTOs;
using LeadGrowth.Models;
using LeadGrowth.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LeadGrowth.Controllers;

[ApiController]
[Route("api/presence")]
[Authorize]
public class UserPresenceController : ControllerBase
{
    private readonly IUserPresenceService _presenceService;
    private readonly LeadGrowthDbContext _context;

    public UserPresenceController(IUserPresenceService presenceService, LeadGrowthDbContext context)
    {
        _presenceService = presenceService;
        _context = context;
    }

    [HttpGet("me")]
    public async Task<ActionResult<UserPresenceDto>> GetMyPresence()
    {
        var email = GetUserEmail();
        try
        {
            var presence = await _presenceService.GetUserPresenceAndWorkloadByEmailAsync(email);
            return Ok(presence);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpGet("team")]
    public async Task<ActionResult<List<UserPresenceDto>>> GetTeamPresence()
    {
        var email = GetUserEmail();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null || !user.WorkspaceId.HasValue)
        {
            return Unauthorized();
        }

        var team = await _presenceService.GetWorkspaceTeamPresenceAsync(user.WorkspaceId.Value);
        return Ok(team);
    }

    [HttpPost("busy")]
    public async Task<ActionResult<UserPresenceDto>> RequestBusy([FromBody] ManualBusyRequest request)
    {
        var email = GetUserEmail();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null) return Unauthorized();

        try
        {
            var presence = await _presenceService.RequestManualBusyAsync(user.Id, request, email, false);
            return Ok(presence);
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

    [HttpPost("break")]
    public async Task<ActionResult<UserPresenceDto>> RequestBreak([FromBody] BreakRequest request)
    {
        var email = GetUserEmail();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null) return Unauthorized();

        try
        {
            var presence = await _presenceService.RequestBreakAsync(user.Id, request, email);
            return Ok(presence);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("available")]
    public async Task<ActionResult<UserPresenceDto>> RequestAvailable()
    {
        var email = GetUserEmail();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null) return Unauthorized();

        try
        {
            var presence = await _presenceService.RequestAvailableAsync(user.Id, email);
            return Ok(presence);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    [HttpPost("heartbeat")]
    public async Task<IActionResult> Heartbeat()
    {
        var email = GetUserEmail();
        await _presenceService.RecordHeartbeatByEmailAsync(email);
        return Ok(new { status = "PONG", timestamp = DateTime.UtcNow });
    }

    [HttpPost("admin-override")]
    [Authorize(Policy = "RequireManagerOrAdmin")]
    public async Task<ActionResult<UserPresenceDto>> AdminOverrideStatus([FromBody] AdminStatusOverrideRequest request)
    {
        var email = GetUserEmail();
        try
        {
            var presence = await _presenceService.AdminUpdateUserStatusAsync(request, email);
            return Ok(presence);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
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

    [HttpGet("history")]
    public async Task<ActionResult<List<UserStatusLog>>> GetStatusHistory([FromQuery] long? userId)
    {
        var email = GetUserEmail();
        var user = await _context.Users.Include(u => u.Roles).FirstOrDefaultAsync(u => u.Email == email);
        if (user == null || !user.WorkspaceId.HasValue) return Unauthorized();

        bool isPrivileged = user.Roles.Any(r => r.Name == "ROLE_ADMIN" || r.Name == "ROLE_MANAGER");
        long targetId = userId.HasValue && isPrivileged ? userId.Value : user.Id;

        var logs = await _context.UserStatusLogs
            .Include(l => l.ChangedBy)
            .Where(l => l.WorkspaceId == user.WorkspaceId.Value && l.UserId == targetId)
            .OrderByDescending(l => l.CreatedAtUtc)
            .Take(50)
            .ToListAsync();

        return Ok(logs);
    }

    private string GetUserEmail()
    {
        return User.FindFirstValue(ClaimTypes.Name) ?? User.FindFirstValue(ClaimTypes.Email) ?? string.Empty;
    }
}
