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

            var now = DateTime.UtcNow;
            var yesterday = now.AddHours(-24);

            var failedLogins24h = await _context.AuditLogs
                .CountAsync(l => (l.Action.Contains("FAILED") || l.Action.Contains("LOCKOUT") || l.Action.Contains("LOCKED")) && l.CreatedAt >= yesterday);

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
                var isOnline = (u.LastHeartbeatAt.HasValue && u.LastHeartbeatAt.Value >= now.AddMinutes(-30))
                               || (u.LastActiveAt.HasValue && u.LastActiveAt.Value >= now.AddHours(-2));

                var isLocked = u.LockoutEnd.HasValue && u.LockoutEnd.Value > now;
                var primaryRole = u.Roles.FirstOrDefault()?.Name.Replace("ROLE_", "") ?? "USER";

                return new
                {
                    id = u.Id,
                    fullName = u.FullName,
                    email = u.Email,
                    role = primaryRole,
                    ipAddress = ip,
                    device = deviceLabel,
                    status = isLocked ? "LOCKED" : (isOnline ? "ONLINE" : "ACTIVE"),
                    failedLoginAttempts = u.FailedLoginAttempts ?? 0,
                    isLocked = isLocked,
                    lockoutEnd = u.LockoutEnd
                };
            }).ToList();

            var lockedAccounts = activeUsers
                .Where(u => u.LockoutEnd.HasValue && u.LockoutEnd.Value > now)
                .Select(u => new
                {
                    id = u.Id,
                    fullName = u.FullName,
                    email = u.Email,
                    failedAttempts = u.FailedLoginAttempts ?? 0,
                    lockoutEnd = u.LockoutEnd,
                    role = u.Roles.FirstOrDefault()?.Name.Replace("ROLE_", "") ?? "USER"
                })
                .ToList();

            var securityActions = new[] { "LOGIN_FAILED", "ACCOUNT_LOCKED", "USER_LOGIN_SUCCESS", "API_KEY_CREATED", "API_KEY_REVOKED", "ADMIN_UNLOCKED_USER", "ROLE_CHANGED", "SECURITY_POLICY_UPDATE" };
            var recentSecurityEvents = await _context.AuditLogs
                .Include(a => a.User)
                .Where(a => securityActions.Contains(a.Action) || a.Action.Contains("LOGIN") || a.Action.Contains("AUTH") || a.Action.Contains("LOCK") || a.Action.Contains("KEY"))
                .OrderByDescending(a => a.CreatedAt)
                .Take(25)
                .Select(a => new
                {
                    id = a.Id,
                    action = a.Action,
                    description = a.Description,
                    userName = a.User != null ? a.User.FullName : "System / Unknown",
                    userEmail = a.User != null ? a.User.Email : "",
                    createdAt = a.CreatedAt
                })
                .ToListAsync();

            var result = new
            {
                activeSessions = activeUsers.Count,
                failedLogins24h = failedLogins24h,
                accountLockoutThreshold = 5,
                lockedAccountsCount = lockedAccounts.Count,
                lockedAccounts = lockedAccounts,
                sessions = sessions,
                recentSecurityEvents = recentSecurityEvents
            };

            return Ok(result);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[SecurityController] Error loading summary: {ex}");
            return StatusCode(500, new { message = "Failed to load security center metrics" });
        }
    }

    [HttpPost("unlock-user/{id}")]
    public async Task<IActionResult> UnlockUser(long id)
    {
        try
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            var adminEmail = User.FindFirstValue(ClaimTypes.Name) ?? User.FindFirstValue(ClaimTypes.Email) ?? "Admin";
            user.FailedLoginAttempts = 0;
            user.LockoutEnd = null;

            var unlockLog = new AuditLog
            {
                WorkspaceId = user.WorkspaceId ?? 1,
                UserId = user.Id,
                Action = "ADMIN_UNLOCKED_USER",
                TargetType = "USER",
                TargetId = user.Id,
                Description = $"Administrator ({adminEmail}) manually reset failed login attempts and unlocked account for {user.FullName} ({user.Email}).",
                CreatedAt = DateTime.UtcNow
            };
            _context.AuditLogs.Add(unlockLog);
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Account for {user.FullName} ({user.Email}) unlocked successfully." });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[SecurityController] Error unlocking user {id}: {ex}");
            return StatusCode(500, new { message = "Failed to unlock user account" });
        }
    }
}
