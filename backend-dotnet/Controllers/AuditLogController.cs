using System.Security.Claims;
using LeadGrowth.Models;
using LeadGrowth.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LeadGrowth.Controllers;

[ApiController]
[Route("api/audit-logs")]
[Route("api/admin/audit-logs")]
[Authorize(Policy = "RequireManagerOrAdmin")]
public class AuditLogController : ControllerBase
{
    private readonly IAuditService _auditService;

    public AuditLogController(IAuditService auditService)
    {
        _auditService = auditService;
    }

    [HttpGet]
    public async Task<ActionResult<List<AuditLog>>> GetAuditLogs()
    {
        var email = GetUserEmail();
        var logs = await _auditService.GetAuditLogsAsync(email);
        return Ok(logs);
    }

    private string GetUserEmail()
    {
        return User.FindFirstValue(ClaimTypes.Name) ?? User.FindFirstValue(ClaimTypes.Email) ?? string.Empty;
    }
}
