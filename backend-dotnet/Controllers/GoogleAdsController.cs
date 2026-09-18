using System.Security.Claims;
using LeadGrowth.Data;
using LeadGrowth.DTOs;
using LeadGrowth.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LeadGrowth.Controllers;

[ApiController]
[Route("api/google")]
[Authorize]
public class GoogleAdsController : ControllerBase
{
    private readonly IGoogleAdsService _googleAdsService;
    private readonly LeadGrowthDbContext _context;
    private readonly ILogger<GoogleAdsController> _logger;

    public GoogleAdsController(
        IGoogleAdsService googleAdsService,
        LeadGrowthDbContext context,
        ILogger<GoogleAdsController> logger)
    {
        _googleAdsService = googleAdsService;
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Lists all campaigns from Google Ads API.
    /// GET /api/google/campaigns
    /// </summary>
    [HttpGet("campaigns")]
    public async Task<ActionResult<List<GoogleCampaignDto>>> ListCampaigns([FromQuery] string? customerId = null)
    {
        try
        {
            var campaigns = await _googleAdsService.ListCampaignsAsync(customerId);
            return Ok(campaigns);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (HttpRequestException ex)
        {
            return StatusCode(StatusCodes.Status502BadGateway, new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error listing Google Ads campaigns");
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    /// <summary>
    /// Retrieves performance metrics and daily breakdown for a campaign or account.
    /// GET /api/google/campaigns/{id}/metrics
    /// </summary>
    [HttpGet("campaigns/{id}/metrics")]
    public async Task<ActionResult<GoogleCampaignMetricsSummaryDto>> GetCampaignMetrics(
        string id,
        [FromQuery] string? customerId = null,
        [FromQuery] string? dateRange = "LAST_30_DAYS")
    {
        try
        {
            var campaignId = id.Equals("all", StringComparison.OrdinalIgnoreCase) ? null : id;
            var metrics = await _googleAdsService.GetCampaignMetricsAsync(customerId, campaignId, dateRange);
            return Ok(metrics);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (HttpRequestException ex)
        {
            return StatusCode(StatusCodes.Status502BadGateway, new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching Google Ads metrics for campaign {CampaignId}", id);
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    /// <summary>
    /// Lists lead form submissions from Google Ads API (retained for up to 60 days).
    /// GET /api/google/leads
    /// </summary>
    [HttpGet("leads")]
    public async Task<ActionResult<List<GoogleLeadDto>>> ListLeads(
        [FromQuery] string? customerId = null,
        [FromQuery] int daysLookback = 60)
    {
        try
        {
            var leads = await _googleAdsService.ListLeadFormSubmissionsAsync(customerId, daysLookback);
            return Ok(leads);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (HttpRequestException ex)
        {
            return StatusCode(StatusCodes.Status502BadGateway, new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching Google Ads leads");
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    /// <summary>
    /// Triggers an immediate synchronization of Google Ads campaigns, daily metrics, and leads for the current workspace.
    /// POST /api/google/sync
    /// </summary>
    [HttpPost("sync")]
    [Authorize(Policy = "RequireManagerOrAdmin")]
    public async Task<ActionResult<GoogleSyncResultDto>> SyncWorkspace([FromQuery] string? customerId = null)
    {
        var email = GetUserEmail();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null || user.WorkspaceId == null)
        {
            return NotFound(new { message = "User workspace not found" });
        }

        try
        {
            var result = await _googleAdsService.SyncWorkspaceGoogleAsync(user.WorkspaceId.Value, customerId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error executing Google Ads sync for workspace {WorkspaceId}", user.WorkspaceId);
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    /// <summary>
    /// Checks Google Ads configuration and verifies token connectivity.
    /// GET /api/google/status
    /// </summary>
    [HttpGet("status")]
    public async Task<ActionResult<GoogleIntegrationStatusDto>> GetStatus([FromQuery] string? customerId = null)
    {
        try
        {
            var status = await _googleAdsService.GetStatusAsync(customerId);
            return Ok(status);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking Google Ads integration status");
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    /// <summary>
    /// Gets token cache and expiration status.
    /// GET /api/google/token-status
    /// </summary>
    [HttpGet("token-status")]
    public async Task<ActionResult<GoogleTokenStatusDto>> GetTokenStatus()
    {
        try
        {
            var tokenStatus = await _googleAdsService.GetTokenStatusAsync();
            return Ok(tokenStatus);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking Google Ads token status");
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    /// <summary>
    /// Forces an OAuth 2.0 access token refresh.
    /// POST /api/google/token-refresh
    /// </summary>
    [HttpPost("token-refresh")]
    [Authorize(Policy = "RequireAdmin")]
    public async Task<ActionResult> ForceRefreshToken()
    {
        try
        {
            await _googleAdsService.RefreshAccessTokenAsync(forceRefresh: true);
            var tokenStatus = await _googleAdsService.GetTokenStatusAsync();
            return Ok(new { message = "Google Ads access token refreshed successfully.", tokenStatus });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error forcing Google Ads access token refresh");
            return BadRequest(new { message = ex.Message });
        }
    }

    private string GetUserEmail()
    {
        return User.FindFirstValue(ClaimTypes.Name) ?? User.FindFirstValue(ClaimTypes.Email) ?? string.Empty;
    }
}
