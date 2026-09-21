using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using LeadGrowth.Data;
using LeadGrowth.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LeadGrowth.Controllers;

[ApiController]
[Route("api/admin/api-keys")]
[Authorize(Policy = "RequireManagerOrAdmin")]
public class ApiKeyController : ControllerBase
{
    private readonly LeadGrowthDbContext _context;

    public ApiKeyController(LeadGrowthDbContext context)
    {
        _context = context;
    }

    public class CreateApiKeyRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Scope { get; set; } = "Full-Access";
    }

    [HttpGet]
    public async Task<IActionResult> GetApiKeys()
    {
        try
        {
            var userEmail = GetCurrentUserEmail();
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == userEmail);
            var workspaceId = user?.WorkspaceId ?? 1;

            var keys = await _context.ApiKeys
                .Where(k => (k.WorkspaceId == workspaceId || k.WorkspaceId == 0) && !k.IsRevoked)
                .OrderByDescending(k => k.CreatedAt)
                .Select(k => new
                {
                    id = k.Id,
                    name = k.Name,
                    keyPrefix = k.KeyPrefix,
                    scope = k.Scope,
                    createdById = k.CreatedById,
                    createdByName = k.CreatedByName,
                    lastUsed = k.LastUsedAt.HasValue 
                        ? GetRelativeTime(k.LastUsedAt.Value) 
                        : "Never",
                    createdDate = k.CreatedAt.ToString("yyyy-MM-dd"),
                    createdAt = k.CreatedAt
                })
                .ToListAsync();

            return Ok(keys);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[ApiKeyController] Error fetching keys: {ex}");
            return StatusCode(500, new { message = "Failed to retrieve API keys" });
        }
    }

    [HttpPost]
    public async Task<IActionResult> CreateApiKey([FromBody] CreateApiKeyRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return BadRequest(new { message = "Key name is required." });
            }

            var userEmail = GetCurrentUserEmail();
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == userEmail);
            var workspaceId = user?.WorkspaceId ?? 1;
            var userName = user?.FullName ?? "Administrator";

            // Generate random cryptographically secure token
            var rawSecret = "pk_live_" + GenerateRandomToken(28);
            var prefix = rawSecret.Substring(0, 14) + "••••••••";
            var keyHash = ComputeSha256Hash(rawSecret);

            var apiKey = new ApiKey
            {
                WorkspaceId = workspaceId,
                Name = request.Name.Trim(),
                KeyPrefix = prefix,
                KeyHash = keyHash,
                Scope = request.Scope == "Read-Only" ? "Read-Only" : "Full-Access",
                CreatedById = user?.Id,
                CreatedByName = userName,
                CreatedAt = DateTime.UtcNow,
                IsRevoked = false
            };

            _context.ApiKeys.Add(apiKey);

            var auditLog = new AuditLog
            {
                WorkspaceId = workspaceId,
                UserId = user?.Id ?? 0,
                Action = "API_KEY_CREATED",
                TargetType = "API_CREDENTIALS",
                TargetId = apiKey.Id,
                Description = $"Administrator {userName} created new API key '{request.Name}' with scope '{apiKey.Scope}'.",
                CreatedAt = DateTime.UtcNow
            };
            _context.AuditLogs.Add(auditLog);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                id = apiKey.Id,
                name = apiKey.Name,
                key = rawSecret, // Return once upon creation
                keyPrefix = prefix,
                scope = apiKey.Scope,
                createdDate = apiKey.CreatedAt.ToString("yyyy-MM-dd"),
                lastUsed = "Never",
                createdByName = userName,
                message = "API key generated successfully. Store this secret securely."
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[ApiKeyController] Error creating API key: {ex}");
            return StatusCode(500, new { message = "Failed to generate API key" });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> RevokeApiKey(long id)
    {
        try
        {
            var userEmail = GetCurrentUserEmail();
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == userEmail);
            var workspaceId = user?.WorkspaceId ?? 1;

            var key = await _context.ApiKeys.FirstOrDefaultAsync(k => k.Id == id && (k.WorkspaceId == workspaceId || k.WorkspaceId == 0));
            if (key == null)
            {
                return NotFound(new { message = "API key not found." });
            }

            key.IsRevoked = true;

            var auditLog = new AuditLog
            {
                WorkspaceId = workspaceId,
                UserId = user?.Id ?? 0,
                Action = "API_KEY_REVOKED",
                TargetType = "API_CREDENTIALS",
                TargetId = key.Id,
                Description = $"Administrator {user?.FullName ?? "Admin"} revoked API key '{key.Name}' ({key.KeyPrefix}).",
                CreatedAt = DateTime.UtcNow
            };
            _context.AuditLogs.Add(auditLog);

            await _context.SaveChangesAsync();

            return Ok(new { message = $"API Key '{key.Name}' has been revoked successfully." });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[ApiKeyController] Error revoking key {id}: {ex}");
            return StatusCode(500, new { message = "Failed to revoke API key" });
        }
    }

    private string GetCurrentUserEmail()
    {
        return User.FindFirstValue(ClaimTypes.Name) ?? User.FindFirstValue(ClaimTypes.Email) ?? string.Empty;
    }

    private static string GenerateRandomToken(int length)
    {
        const string chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        var bytes = new byte[length];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(bytes);
        var sb = new StringBuilder(length);
        foreach (var b in bytes)
        {
            sb.Append(chars[b % chars.Length]);
        }
        return sb.ToString();
    }

    private static string ComputeSha256Hash(string rawData)
    {
        using var sha256 = SHA256.Create();
        var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(rawData));
        var builder = new StringBuilder();
        foreach (var b in bytes)
        {
            builder.Append(b.ToString("x2"));
        }
        return builder.ToString();
    }

    private static string GetRelativeTime(DateTime dt)
    {
        var diff = DateTime.UtcNow - dt;
        if (diff.TotalMinutes < 1) return "Just now";
        if (diff.TotalMinutes < 60) return $"{(int)diff.TotalMinutes}m ago";
        if (diff.TotalHours < 24) return $"{(int)diff.TotalHours}h ago";
        return $"{(int)diff.TotalDays}d ago";
    }
}
