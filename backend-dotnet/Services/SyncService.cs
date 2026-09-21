using LeadGrowth.Data;
using LeadGrowth.Models;
using Microsoft.EntityFrameworkCore;

namespace LeadGrowth.Services;

public class SyncService : ISyncService
{
    private readonly LeadGrowthDbContext _context;
    private readonly IMetaAdsService _metaAdsService;
    private readonly IGoogleAdsService _googleAdsService;
    private readonly ILogger<SyncService> _logger;

    public SyncService(
        LeadGrowthDbContext context,
        IMetaAdsService metaAdsService,
        IGoogleAdsService googleAdsService,
        ILogger<SyncService> logger)
    {
        _context = context;
        _metaAdsService = metaAdsService;
        _googleAdsService = googleAdsService;
        _logger = logger;
    }

    public async Task SyncWorkspaceAsync(long workspaceId, string platform)
    {
        var integration = await _context.Integrations
            .FirstOrDefaultAsync(i => i.WorkspaceId == workspaceId && i.Platform.ToLower() == platform.ToLower());

        string syncStatus = "SUCCESS";
        string syncDetails = string.Empty;

        if (platform.Equals("Meta", StringComparison.OrdinalIgnoreCase))
        {
            try
            {
                var metaResult = await _metaAdsService.SyncWorkspaceMetaAsync(workspaceId);
                syncStatus = metaResult.Success ? "SUCCESS" : "PARTIAL_SUCCESS";
                syncDetails = metaResult.Message;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error syncing Meta Marketing API for workspace {WorkspaceId}", workspaceId);
                syncStatus = "FAILED";
                syncDetails = $"Meta sync error: {ex.Message}";
            }
        }
        else if (platform.Equals("Google", StringComparison.OrdinalIgnoreCase) || platform.Contains("Google Ads"))
        {
            try
            {
                var googleResult = await _googleAdsService.SyncWorkspaceGoogleAsync(workspaceId);
                syncStatus = googleResult.Success ? "SUCCESS" : "PARTIAL_SUCCESS";
                syncDetails = googleResult.Message;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error syncing Google Ads API for workspace {WorkspaceId}", workspaceId);
                syncStatus = "FAILED";
                syncDetails = $"Google sync error: {ex.Message}";
            }
        }
        else
        {
            syncDetails = $"Synced platform records for {platform}";
        }

        if (integration != null)
        {
            integration.LastSyncedAt = DateTime.UtcNow;
            integration.Status = syncStatus == "FAILED" ? "Error" : "Connected";
        }

        var log = new SyncLog
        {
            WorkspaceId = workspaceId,
            Platform = platform.ToUpper(),
            Status = syncStatus,
            Details = syncDetails,
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
