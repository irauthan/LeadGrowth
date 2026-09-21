using System.Security.Claims;
using LeadGrowth.DTOs;
using LeadGrowth.Models;
using LeadGrowth.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LeadGrowth.Controllers;

[ApiController]
[Route("api/campaigns")]
[Authorize]
public class CampaignController : ControllerBase
{
    private readonly ICampaignService _campaignService;

    public CampaignController(ICampaignService campaignService)
    {
        _campaignService = campaignService;
    }

    [HttpGet]
    public async Task<ActionResult<List<Campaign>>> GetCampaigns(
        [FromQuery] string? period,
        [FromQuery] string? startDate,
        [FromQuery] string? endDate)
    {
        var email = GetUserEmail();
        var campaigns = await _campaignService.GetCampaignsAsync(email, period, startDate, endDate);
        return Ok(campaigns);
    }

    [HttpGet("user-view")]
    public async Task<ActionResult<List<Dictionary<string, object>>>> GetUserCampaigns()
    {
        var email = GetUserEmail();
        var campaigns = await _campaignService.GetUserCampaignsAsync(email);
        return Ok(campaigns);
    }

    [HttpGet("sync-status")]
    public async Task<ActionResult<CampaignSyncStatusDto>> GetSyncStatus()
    {
        var email = GetUserEmail();
        try
        {
            var status = await _campaignService.GetSyncStatusAsync(email);
            return Ok(status);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("ad-accounts")]
    public async Task<ActionResult<List<AdAccountInfoDto>>> GetAdAccounts([FromQuery] string? platform = null)
    {
        var email = GetUserEmail();
        try
        {
            var accounts = await _campaignService.GetConnectedAdAccountsAsync(email, platform);
            return Ok(accounts);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("sync")]
    [Authorize(Policy = "RequireManagerOrAdmin")]
    public async Task<ActionResult<CampaignSyncStatusDto>> SyncCampaigns([FromQuery] string? platform = null)
    {
        var email = GetUserEmail();
        try
        {
            var result = await _campaignService.SyncWorkspaceCampaignsAsync(email, platform);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    [HttpPost("platform-create")]
    [Authorize(Policy = "RequireManagerOrAdmin")]
    public async Task<ActionResult<PlatformCampaignResultDto>> CreatePlatformCampaign([FromBody] CreatePlatformCampaignDto dto)
    {
        var email = GetUserEmail();
        try
        {
            var result = await _campaignService.CreatePlatformCampaignAsync(dto, email);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (HttpRequestException ex)
        {
            return StatusCode(StatusCodes.Status502BadGateway, new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    [HttpPost]
    [Authorize(Policy = "RequireManagerOrAdmin")]
    public ActionResult CreateLegacyCampaign([FromBody] Campaign campaign)
    {
        return BadRequest(new 
        { 
            message = "Standalone manual campaign creation is disabled. Please create campaigns through connected Meta Ads or Google Ads accounts via the 'Create Campaign' wizard." 
        });
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<object>> GetCampaignDetails(long id)
    {
        var email = GetUserEmail();
        try
        {
            var details = await _campaignService.GetCampaignDetailsAsync(id, email);
            if (details == null) return NotFound(new { message = "Campaign not found" });
            return Ok(details);
        }
        catch (KeyNotFoundException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    [Authorize(Policy = "RequireManagerOrAdmin")]
    public async Task<ActionResult<Campaign>> UpdateCampaign(long id, [FromBody] Campaign campaign)
    {
        var email = GetUserEmail();
        try
        {
            var updated = await _campaignService.UpdateCampaignAsync(id, campaign, email);
            return Ok(updated);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (HttpRequestException ex)
        {
            return StatusCode(StatusCodes.Status502BadGateway, new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    [HttpPatch("{id}/status")]
    public async Task<ActionResult<Campaign>> UpdateCampaignStatus(long id, [FromBody] StatusUpdateDto dto)
    {
        var email = GetUserEmail();
        try
        {
            var updated = await _campaignService.UpdateCampaignStatusAsync(id, dto.Status, email);
            return Ok(updated);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (HttpRequestException ex)
        {
            return StatusCode(StatusCodes.Status502BadGateway, new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    [HttpPatch("{id}/budget")]
    [Authorize(Policy = "RequireManagerOrAdmin")]
    public async Task<ActionResult<Campaign>> UpdateCampaignBudget(long id, [FromBody] BudgetUpdateDto dto)
    {
        var email = GetUserEmail();
        try
        {
            var updated = await _campaignService.UpdateCampaignBudgetAsync(id, dto.Budget, email);
            return Ok(updated);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (HttpRequestException ex)
        {
            return StatusCode(StatusCodes.Status502BadGateway, new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "RequireManagerOrAdmin")]
    public async Task<ActionResult> DeleteCampaign(long id)
    {
        var email = GetUserEmail();
        try
        {
            var success = await _campaignService.DeleteCampaignAsync(id, email);
            if (!success) return NotFound(new { message = "Campaign not found" });
            return Ok(new { message = "Campaign deleted successfully" });
        }
        catch (KeyNotFoundException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    public class StatusUpdateDto
    {
        public string Status { get; set; } = string.Empty;
    }

    public class BudgetUpdateDto
    {
        public decimal Budget { get; set; }
    }

    private string GetUserEmail()
    {
        return User.FindFirstValue(ClaimTypes.Name) ?? User.FindFirstValue(ClaimTypes.Email) ?? string.Empty;
    }
}

