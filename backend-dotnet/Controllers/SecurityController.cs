using System.Security.Claims;
using LeadGrowth.Data;
using LeadGrowth.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LeadGrowth.Controllers;

[ApiController]
[Route("api/admin/security")]
[Authorize(Policy = "RequireManagerOrAdmin")]
public class SecurityController : ControllerBase
{
    private readonly LeadGrowthDbContext _context;

    public SecurityController(LeadGrowthDbContext context)
    {
        _context = context;
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetSecuritySummary()
    {
        try
        {
            var activeUsers = await _context.Users
                .Include(u => u.Roles)
                .Where(u => u.Status == null || !string.Equals("SUSPENDED", u.Status))
                .ToListAsync();

            var yesterday = DateTime.UtcNow.AddHours(-24);
            var failedLogins24h = await _context.AuditLogs
                .CountAsync(l => l.Action.Contains("FAILED") && l.CreatedAt >= yesterday);

            var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
            if (string.IsNullOrWhiteSpace(ip) || ip == "::1")
            {
                ip = "127.0.0.1";
            }

            var rawAgent = Request.Headers.UserAgent.ToString();
            var deviceLabel = "Chrome / Windows";
            if (!string.IsNullOrWhiteSpace(rawAgent))
            {
                if (rawAgent.Contains("Windows")) deviceLabel = "Windows Desktop";
                else if (rawAgent.Contains("Mac")) deviceLabel = "Mac OS Desktop";
                else if (rawAgent.Contains("Linux")) deviceLabel = "Linux Workstation";
                else if (rawAgent.Contains("Android")) deviceLabel = "Android Mobile";
                else if (rawAgent.Contains("iPhone")) deviceLabel = "iOS Mobile";
            }

            var sessions = activeUsers.Select(u =>
            {
                var isOnline = (u.LastHeartbeatAt.HasValue && u.LastHeartbeatAt.Value >= DateTime.UtcNow.AddMinutes(-30))
                               || (u.LastActiveAt.HasValue && u.LastActiveAt.Value >= DateTime.UtcNow.AddHours(-2));

                var primaryRole = u.Roles.FirstOrDefault()?.Name.Replace("ROLE_", "") ?? "USER";

                return new
                {
                    fullName = u.FullName,
                    email = u.Email,
                    role = primaryRole,
                    ipAddress = ip,
                    device = deviceLabel,
                    status = isOnline ? "ONLINE" : "ACTIVE"
                };
            }).ToList();

            var result = new
            {
                activeSessions = activeUsers.Count,
                failedLogins24h = failedLogins24h,
                accountLockoutThreshold = 5,
                sessions = sessions
            };

            return Ok(result);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[SecurityController] Error loading summary: {ex}");
            return StatusCode(500, new { message = "Failed to load security center metrics" });
        }
    }
}
