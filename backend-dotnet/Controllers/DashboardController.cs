using System.Security.Claims;
using LeadGrowth.DTOs;
using LeadGrowth.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LeadGrowth.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    [HttpGet]
    public async Task<ActionResult<DashboardKpis>> GetDashboardData([FromQuery] string? period, [FromQuery] string? startDate, [FromQuery] string? endDate)
    {
        var email = GetUserEmail();
        try
        {
            var kpis = await _dashboardService.GetDashboardDataAsync(email, period, startDate, endDate);
            return Ok(kpis);
        }
        catch (KeyNotFoundException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("search")]
    public async Task<ActionResult<List<SearchResultDto>>> SearchGlobal([FromQuery] string q)
    {
        var email = GetUserEmail();
        var results = await _dashboardService.SearchGlobalAsync(q, email);
        return Ok(results);
    }

    private string GetUserEmail()
    {
        return User.FindFirstValue(ClaimTypes.Name) ?? User.FindFirstValue(ClaimTypes.Email) ?? string.Empty;
    }
}
