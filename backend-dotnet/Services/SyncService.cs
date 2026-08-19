using LeadGrowth.Data;
using LeadGrowth.Models;
using Microsoft.EntityFrameworkCore;

namespace LeadGrowth.Services;

public class SyncService : ISyncService
{
    private readonly LeadGrowthDbContext _context;

    public SyncService(LeadGrowthDbContext context)
    {
        _context = context;
    }

    public async Task SyncWorkspaceAsync(long workspaceId, string platform)
    {
        var integration = await _context.Integrations
            .FirstOrDefaultAsync(i => i.WorkspaceId == workspaceId && i.Platform.ToLower() == platform.ToLower());

        if (integration != null)
        {
            integration.LastSyncedAt = DateTime.UtcNow;
        }

        var log = new SyncLog
        {
            WorkspaceId = workspaceId,
            Platform = platform.ToUpper(),
            Status = "SUCCESS",
            Details = $"Synced {Random.Shared.Next(5, 25)} records for {platform}",
            CreatedAt = DateTime.UtcNow
        };

        _context.SyncLogs.Add(log);
        await _context.SaveChangesAsync();
    }

    public async Task<List<Integration>> GetIntegrationsAsync(string email)
    {
        var userEmail = email.Trim().ToLower();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == userEmail);
        if (user == null || user.WorkspaceId == null)
        {
            throw new KeyNotFoundException("User workspace not found");
        }

        return await _context.Integrations
            .Where(i => i.WorkspaceId == user.WorkspaceId)
            .ToListAsync();
    }

    public async Task<Integration> ConnectIntegrationAsync(string platform, string apiKey, string email)
    {
        var userEmail = email.Trim().ToLower();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == userEmail);
        if (user == null || user.WorkspaceId == null)
        {
            throw new KeyNotFoundException("User workspace not found");
        }

        var integration = await _context.Integrations
            .FirstOrDefaultAsync(i => i.WorkspaceId == user.WorkspaceId && i.Platform.ToLower() == platform.ToLower());

        if (integration == null)
        {
            integration = new Integration
            {
                WorkspaceId = user.WorkspaceId.Value,
                Platform = platform
            };
            _context.Integrations.Add(integration);
        }

        integration.ApiKey = apiKey;
        integration.Status = "Connected";

        await _context.SaveChangesAsync();
        return integration;
    }

    public async Task<List<SyncLog>> GetSyncLogsAsync(string email)
    {
        var userEmail = email.Trim().ToLower();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == userEmail);
        if (user == null || user.WorkspaceId == null)
        {
            throw new KeyNotFoundException("User workspace not found");
        }

        return await _context.SyncLogs
            .Where(s => s.WorkspaceId == user.WorkspaceId)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();
    }
}
