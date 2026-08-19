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

    private string GetUserEmail()
    {
        return User.FindFirstValue(ClaimTypes.Name) ?? User.FindFirstValue(ClaimTypes.Email) ?? string.Empty;
    }
}
