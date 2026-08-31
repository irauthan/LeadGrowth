using System.Security.Claims;
using LeadGrowth.DTOs;
using LeadGrowth.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LeadGrowth.Controllers;

[ApiController]
[Route("api/admin/executive-work")]
[Authorize]
public class ExecutiveWorkMonitoringController : ControllerBase
{
    private readonly IExecutiveWorkMonitoringService _executiveWorkMonitoringService;

    public ExecutiveWorkMonitoringController(IExecutiveWorkMonitoringService executiveWorkMonitoringService)
    {
        _executiveWorkMonitoringService = executiveWorkMonitoringService;
    }

    [HttpGet]
    public async Task<ActionResult<ExecutiveWorkSummaryDto>> GetExecutiveWork(
        [FromQuery] long? userId,
        [FromQuery] string timeframe = "THIS_MONTH",
        [FromQuery] string? startDate = null,
        [FromQuery] string? endDate = null)
    {
        var email = GetUserEmail();
        try
        {
            var summary = await _executiveWorkMonitoringService.GetExecutiveWorkSummaryAsync(email, userId, timeframe, startDate, endDate);
            return Ok(summary);
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
