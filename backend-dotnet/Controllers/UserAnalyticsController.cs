using System.Security.Claims;
using LeadGrowth.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LeadGrowth.Controllers;

[ApiController]
[Route("api/users/me")]
[Authorize]
public class UserAnalyticsController : ControllerBase
{
    private readonly IUserAnalyticsService _userAnalyticsService;

    public UserAnalyticsController(IUserAnalyticsService userAnalyticsService)
    {
        _userAnalyticsService = userAnalyticsService;
    }

    [HttpGet("dashboard")]
    public async Task<ActionResult<Dictionary<string, object>>> GetDashboardKpis(
        [FromQuery] string? period,
        [FromQuery] string? startDate,
        [FromQuery] string? endDate)
    {
        var email = GetUserEmail();
        var kpis = await _userAnalyticsService.GetUserDashboardKpisAsync(email, period, startDate, endDate);
        return Ok(kpis);
    }

    [HttpGet("analytics")]
    public async Task<ActionResult<Dictionary<string, object>>> GetAnalytics(
        [FromQuery] string? period,
        [FromQuery] string? startDate,
        [FromQuery] string? endDate)
    {
        var email = GetUserEmail();
        var analytics = await _userAnalyticsService.GetUserAnalyticsAsync(email, period, startDate, endDate);
        return Ok(analytics);
    }

    private string GetUserEmail()
    {
        return User.FindFirstValue(ClaimTypes.Name) ?? User.FindFirstValue(ClaimTypes.Email) ?? string.Empty;
    }
}
