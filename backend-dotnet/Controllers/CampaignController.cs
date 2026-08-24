using System.Security.Claims;
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
    public async Task<ActionResult<List<Campaign>>> GetCampaigns()
    {
        var email = GetUserEmail();
        var campaigns = await _campaignService.GetCampaignsAsync(email);
        return Ok(campaigns);
    }

    [HttpGet("user-view")]
    public async Task<ActionResult<List<Dictionary<string, object>>>> GetUserCampaigns()
    {
        var email = GetUserEmail();
        var campaigns = await _campaignService.GetUserCampaignsAsync(email);
        return Ok(campaigns);
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

    [HttpPost]
    [Authorize(Policy = "RequireManagerOrAdmin")]
    public async Task<ActionResult<Campaign>> CreateCampaign([FromBody] Campaign campaign)
    {
        var email = GetUserEmail();
        try
        {
            var created = await _campaignService.CreateCampaignAsync(campaign, email);
            return Ok(created);
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

    private string GetUserEmail()
    {
        return User.FindFirstValue(ClaimTypes.Name) ?? User.FindFirstValue(ClaimTypes.Email) ?? string.Empty;
    }
}
