using System.Security.Claims;
using LeadGrowth.Models;
using LeadGrowth.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LeadGrowth.Controllers;

[ApiController]
[Route("api/integrations")]
[Authorize]
public class IntegrationController : ControllerBase
{
    private readonly ISyncService _syncService;

    public IntegrationController(ISyncService syncService)
    {
        _syncService = syncService;
    }

    [HttpGet]
    public async Task<ActionResult<List<Integration>>> GetIntegrations()
    {
        var email = GetUserEmail();
        var integrations = await _syncService.GetIntegrationsAsync(email);
        return Ok(integrations);
    }

    [HttpPost("connect")]
    [Authorize(Policy = "RequireAdmin")]
    public async Task<ActionResult<Integration>> ConnectIntegration([FromQuery] string platform, [FromQuery] string apiKey)
    {
        var email = GetUserEmail();
        try
        {
            var integration = await _syncService.ConnectIntegrationAsync(platform, apiKey, email);
            return Ok(integration);
        }
        catch (KeyNotFoundException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("sync")]
    [Authorize(Policy = "RequireAdmin")]
    public async Task<IActionResult> TriggerManualSync([FromQuery] string platform)
    {
        var email = GetUserEmail();
        var integrations = await _syncService.GetIntegrationsAsync(email);
        var integration = integrations.FirstOrDefault(i => i.Platform.Equals(platform, StringComparison.OrdinalIgnoreCase));
        if (integration != null)
        {
            await _syncService.SyncWorkspaceAsync(integration.WorkspaceId, platform);
        }
        return Ok();
    }

    [HttpGet("sync-logs")]
    public async Task<ActionResult<List<SyncLog>>> GetSyncLogs()
    {
        var email = GetUserEmail();
        var logs = await _syncService.GetSyncLogsAsync(email);
        return Ok(logs);
    }

    private string GetUserEmail()
    {
        return User.FindFirstValue(ClaimTypes.Name) ?? User.FindFirstValue(ClaimTypes.Email) ?? string.Empty;
    }
}
