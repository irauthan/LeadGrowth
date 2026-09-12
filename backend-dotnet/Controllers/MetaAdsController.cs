using System.Security.Claims;
using LeadGrowth.Data;
using LeadGrowth.DTOs;
using LeadGrowth.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LeadGrowth.Controllers;

[ApiController]
[Route("api/meta")]
[Authorize]
public class MetaAdsController : ControllerBase
{
    private readonly IMetaAdsService _metaAdsService;
    private readonly LeadGrowthDbContext _context;
    private readonly ILogger<MetaAdsController> _logger;

    public MetaAdsController(
        IMetaAdsService metaAdsService,
        LeadGrowthDbContext context,
        ILogger<MetaAdsController> logger)
    {
        _metaAdsService = metaAdsService;
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// PART A - 1. Create a campaign on Meta Marketing API.
    /// POST /api/meta/campaigns
    /// </summary>
    [HttpPost("campaigns")]
    [Authorize(Policy = "RequireManagerOrAdmin")]
    public async Task<ActionResult<MetaIdResponse>> CreateCampaign([FromBody] CreateMetaCampaignDto dto)
    {
        try
        {
            var response = await _metaAdsService.CreateCampaignAsync(dto);
            return Ok(response);
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
            _logger.LogError(ex, "Error creating Meta campaign");
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    /// <summary>
    /// PART A - 2. Create an ad set on Meta Marketing API.
    /// POST /api/meta/adsets
    /// </summary>
    [HttpPost("adsets")]
    [Authorize(Policy = "RequireManagerOrAdmin")]
    public async Task<ActionResult<MetaIdResponse>> CreateAdSet([FromBody] CreateMetaAdSetDto dto)
    {
        try
        {
            var response = await _metaAdsService.CreateAdSetAsync(dto);
            return Ok(response);
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
            _logger.LogError(ex, "Error creating Meta ad set");
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    /// <summary>
    /// PART A - 3. List campaigns from Meta.
    /// GET /api/meta/campaigns
    /// </summary>
    [HttpGet("campaigns")]
    public async Task<ActionResult<List<MetaCampaignItem>>> ListCampaigns(
        [FromQuery] string? userToken = null,
        [FromQuery] string? adAccountId = null)
    {
        try
        {
            var campaigns = await _metaAdsService.ListCampaignsAsync(userToken, adAccountId);
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
            _logger.LogError(ex, "Error listing Meta campaigns");
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    /// <summary>
    /// PART A - 4. Get insights for a campaign.
    /// GET /api/meta/campaigns/{campaignId}/insights
    /// </summary>
    [HttpGet("campaigns/{campaignId}/insights")]
    public async Task<ActionResult<MetaInsightSummaryDto>> GetCampaignInsights(
        string campaignId,
        [FromQuery] string? userToken = null,
        [FromQuery] bool dailyTrend = false,
        [FromQuery] string? datePreset = "last_30d")
    {
        try
        {
            var insights = await _metaAdsService.GetCampaignInsightsAsync(campaignId, userToken, dailyTrend, datePreset);
            return Ok(insights);
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
            _logger.LogError(ex, "Error getting Meta campaign insights");
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    /// <summary>
    /// PART B - 5. Create a Lead Form on Meta (requires Page Access Token).
    /// POST /api/meta/forms
    /// </summary>
    [HttpPost("forms")]
    [Authorize(Policy = "RequireManagerOrAdmin")]
    public async Task<ActionResult<MetaIdResponse>> CreateLeadForm([FromBody] CreateMetaLeadFormDto dto)
    {
        try
        {
            var response = await _metaAdsService.CreateLeadFormAsync(dto);
            return Ok(response);
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
            _logger.LogError(ex, "Error creating Meta lead form");
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    /// <summary>
    /// PART B - 6. List Lead Forms for a Page (requires Page Access Token).
    /// GET /api/meta/forms
    /// </summary>
    [HttpGet("forms")]
    public async Task<ActionResult<List<MetaLeadFormItem>>> ListLeadForms(
        [FromQuery] string? pageToken = null,
        [FromQuery] string? pageId = null)
    {
        try
        {
            var forms = await _metaAdsService.ListLeadFormsAsync(pageToken, pageId);
            return Ok(forms);
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
            _logger.LogError(ex, "Error listing Meta lead forms");
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    /// <summary>
    /// PART B - 7. Get Leads captured by a Form (requires Page Access Token).
    /// GET /api/meta/forms/{formId}/leads
    /// </summary>
    [HttpGet("forms/{formId}/leads")]
    public async Task<ActionResult<List<MetaLeadItem>>> GetLeadsForForm(
        string formId,
        [FromQuery] string? pageToken = null)
    {
        try
        {
            var leads = await _metaAdsService.GetLeadsForFormAsync(formId, pageToken);
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
            _logger.LogError(ex, "Error fetching leads for form {FormId}", formId);
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    /// <summary>
    /// Helper: Get Page Access Token from Business Manager owned pages.
    /// GET /api/meta/page-token
    /// </summary>
    [HttpGet("page-token")]
    [Authorize(Policy = "RequireAdmin")]
    public async Task<ActionResult<object>> GetPageAccessToken(
        [FromQuery] string businessManagerId,
        [FromQuery] string pageId,
        [FromQuery] string? userToken = null)
    {
        try
        {
            var token = await _metaAdsService.GetPageAccessTokenFromBusinessAsync(businessManagerId, pageId, userToken);
            if (string.IsNullOrWhiteSpace(token))
            {
                return NotFound(new { message = "Page access token could not be retrieved from Business Manager." });
            }

            return Ok(new { pageId, pageAccessToken = token });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting Page access token");
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    /// <summary>
    /// Trigger manual Meta synchronization for current workspace.
    /// POST /api/meta/sync
    /// </summary>
    [HttpPost("sync")]
    [Authorize(Policy = "RequireAdmin")]
    public async Task<ActionResult<MetaSyncResultDto>> TriggerMetaSync(
        [FromQuery] string? userToken = null,
        [FromQuery] string? pageToken = null,
        [FromQuery] string? adAccountId = null,
        [FromQuery] string? pageId = null)
    {
        var email = GetUserEmail();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email.ToLower());
        if (user == null || user.WorkspaceId == null)
        {
            return BadRequest(new { message = "User workspace not found." });
        }

        try
        {
            var syncResult = await _metaAdsService.SyncWorkspaceMetaAsync(
                user.WorkspaceId.Value,
                userToken,
                pageToken,
                adAccountId,
                pageId);

            return Ok(syncResult);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during manual Meta sync");
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    /// <summary>
    /// Get Meta integration configuration and token health check status.
    /// GET /api/meta/status
    /// </summary>
    [HttpGet("status")]
    [AllowAnonymous]
    public async Task<ActionResult<MetaIntegrationStatusDto>> GetStatus(
        [FromQuery] string? userToken = null,
        [FromQuery] string? pageToken = null,
        [FromQuery] string? adAccountId = null,
        [FromQuery] string? pageId = null)
    {
        var status = await _metaAdsService.GetStatusAsync(userToken, pageToken, adAccountId, pageId);
        return Ok(status);
    }

    /// <summary>
    /// Get Meta access token expiration timestamps and health status for User and Page tokens.
    /// GET /api/meta/token-status
    /// </summary>
    [HttpGet("token-status")]
    [AllowAnonymous]
    public async Task<ActionResult<MetaTokenStatusDto>> GetTokenStatus()
    {
        try
        {
            var status = await _metaAdsService.GetTokenStatusAsync();
            return Ok(status);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving Meta token status");
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    /// <summary>
    /// Explicitly triggers long-lived token exchange for a short-lived token or refreshes stored token.
    /// POST /api/meta/exchange-token
    /// </summary>
    [HttpPost("exchange-token")]
    [AllowAnonymous]
    public async Task<ActionResult<object>> ExchangeToken([FromBody] ExchangeTokenRequestDto? request)
    {
        try
        {
            var tokenToExchange = request?.Token;
            if (string.IsNullOrWhiteSpace(tokenToExchange))
            {
                var stored = await _context.MetaTokens.FirstOrDefaultAsync(t => t.TokenType == "User");
                tokenToExchange = stored?.AccessToken;
            }

            if (string.IsNullOrWhiteSpace(tokenToExchange))
            {
                return BadRequest(new { message = "No token provided and no stored User token found to exchange." });
            }

            var longLivedToken = await _metaAdsService.ExchangeForLongLivedTokenAsync(tokenToExchange);
            var status = await _metaAdsService.GetTokenStatusAsync();
            return Ok(new
            {
                message = "Meta token successfully exchanged for long-lived (~60 days) token.",
                status
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error exchanging Meta access token");
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    /// <summary>
    /// Forces re-seeding and long-lived token exchange from appsettings.json, clearing stale DB tokens.
    /// POST /api/meta/reseed-tokens
    /// </summary>
    [HttpPost("reseed-tokens")]
    [AllowAnonymous]
    public async Task<ActionResult<object>> ReseedTokens()
    {
        try
        {
            var status = await _metaAdsService.ReseedFromConfigAsync(force: true);
            return Ok(new
            {
                message = "Meta tokens successfully re-seeded from appsettings.json and exchanged for long-lived tokens.",
                status
            });
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Meta API rejected long-lived token exchange during reseed");
            return StatusCode(StatusCodes.Status502BadGateway, new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(ex, "Configuration or token validation error during reseed");
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error re-seeding Meta tokens from config");
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    /// <summary>
    /// Clears all stored tokens from the meta_tokens table.
    /// POST /api/meta/clear-tokens
    /// </summary>
    [HttpPost("clear-tokens")]
    [AllowAnonymous]
    public async Task<ActionResult<object>> ClearTokens()
    {
        try
        {
            await _metaAdsService.ClearTokensAsync();
            return Ok(new { message = "All tokens removed from meta_tokens table." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error clearing tokens");
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    private string GetUserEmail()
    {
        return User.FindFirstValue(ClaimTypes.Name) ?? User.FindFirstValue(ClaimTypes.Email) ?? string.Empty;
    }
}
