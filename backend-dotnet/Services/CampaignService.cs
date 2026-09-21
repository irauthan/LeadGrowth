using LeadGrowth.Data;
using LeadGrowth.DTOs;
using LeadGrowth.Models;
using Microsoft.EntityFrameworkCore;

namespace LeadGrowth.Services;

public class CampaignService : ICampaignService
{
    private readonly LeadGrowthDbContext _context;
    private readonly IMetaAdsService _metaAdsService;
    private readonly IGoogleAdsService _googleAdsService;
    private readonly ILogger<CampaignService> _logger;

    public CampaignService(
        LeadGrowthDbContext context,
        IMetaAdsService metaAdsService,
        IGoogleAdsService googleAdsService,
        ILogger<CampaignService> logger)
    {
        _context = context;
        _metaAdsService = metaAdsService;
        _googleAdsService = googleAdsService;
        _logger = logger;
    }

    public async Task<List<Campaign>> GetCampaignsAsync(string email, string? period = null, string? startDate = null, string? endDate = null)
    {
        var userEmail = email.Trim().ToLower();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == userEmail);
        if (user == null || user.WorkspaceId == null)
        {
            throw new KeyNotFoundException("User workspace not found");
        }

        var (rangeStart, rangeEnd) = DateRangeHelper.ParsePeriodRange(period, startDate, endDate);
        var isFiltered = !string.IsNullOrWhiteSpace(period) && !"all".Equals(period, StringComparison.OrdinalIgnoreCase);

        var query = _context.Campaigns.Where(c => c.WorkspaceId == user.WorkspaceId);

        if (isFiltered)
        {
            query = query.Where(c => c.CreatedAt >= rangeStart && c.CreatedAt <= rangeEnd);
        }

        var campaigns = await query
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        // Dynamically compute leads count, conversions, and revenue from actual workspace leads
        var leads = await _context.Leads
            .Where(l => l.WorkspaceId == user.WorkspaceId)
            .Select(l => new {
                l.Id,
                l.CampaignId,
                l.CampaignName,
                l.Status,
                l.ProposalAmount
            })
            .ToListAsync();

        bool hasLegacyUpdates = false;
        foreach (var c in campaigns)
        {
            // Identify legacy manual campaigns if no external ID exists
            if (string.IsNullOrWhiteSpace(c.ExternalCampaignId) && !c.IsLegacy)
            {
                c.IsLegacy = true;
                hasLegacyUpdates = true;
            }

            var campLeads = leads.Where(l => 
                l.CampaignId == c.Id || 
                (!string.IsNullOrEmpty(l.CampaignName) && l.CampaignName.Equals(c.Name, StringComparison.OrdinalIgnoreCase))
            ).ToList();

            var convertedLeads = campLeads.Where(l => IsConvertedStatus(l.Status)).ToList();
            var convertedRevenue = (decimal)convertedLeads
                .Where(l => l.ProposalAmount.HasValue && l.ProposalAmount.Value > 0)
                .Sum(l => l.ProposalAmount!.Value);

            c.LeadsCount = Math.Max(c.LeadsCount, campLeads.Count);
            c.Conversions = Math.Max(c.Conversions, convertedLeads.Count);
            c.Revenue = convertedRevenue;
        }

        if (hasLegacyUpdates)
        {
            await _context.SaveChangesAsync();
        }

        return campaigns;
    }

    public async Task<List<Dictionary<string, object>>> GetUserCampaignsAsync(string email)
    {
        var userEmail = email.Trim().ToLower();
        var user = await _context.Users
            .Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.Email == userEmail);

        if (user == null || user.WorkspaceId == null)
        {
            throw new KeyNotFoundException("User workspace not found");
        }

        var campaigns = await GetCampaignsAsync(email);
        var isAdminOrManager = user.Roles.Any(r => 
            r.Name.ToUpper().Contains("ADMIN") || 
            r.Name.ToUpper().Contains("MANAGER")
        );

        if (isAdminOrManager)
        {
            return campaigns.Select(c => new Dictionary<string, object>
            {
                { "id", c.Id },
                { "name", c.Name },
                { "platform", c.Platform },
                { "status", c.Status ?? "ACTIVE" },
                { "budget", c.Budget },
                { "spend", c.Spend },
                { "clicks", c.Clicks },
                { "impressions", c.Impressions },
                { "leadsCount", c.LeadsCount },
                { "conversions", c.Conversions },
                { "revenue", c.Revenue },
                { "externalCampaignId", c.ExternalCampaignId ?? "" },
                { "adAccountId", c.AdAccountId ?? "" },
                { "isLegacy", c.IsLegacy },
                { "lastSyncedAt", c.LastSyncedAt?.ToString("o") ?? "" },
                { "syncStatus", c.SyncStatus ?? "SYNCED" },
                { "platformStatus", c.PlatformStatus ?? c.Status ?? "ACTIVE" },
                { "placements", c.Placements ?? "" },
                { "createdAt", c.CreatedAt.ToString("o") }
            }).ToList();
        }

        // For regular user: personal lead attribution
        var userLeads = await _context.Leads
            .Where(l => l.WorkspaceId == user.WorkspaceId && l.AssignedToId == user.Id)
            .ToListAsync();

        return campaigns.Select(c =>
        {
            var myLeads = userLeads.Where(l => 
                l.CampaignId == c.Id || 
                (l.CampaignName != null && l.CampaignName.Equals(c.Name, StringComparison.OrdinalIgnoreCase))
            ).ToList();

            var myConverted = myLeads.Where(l => IsConvertedStatus(l.Status)).ToList();

            var myRevenue = (decimal)myConverted
                .Where(l => l.ProposalAmount.HasValue && l.ProposalAmount.Value > 0)
                .Sum(l => l.ProposalAmount!.Value);
            var myConversions = myConverted.Count;
            var myLeadsCount = myLeads.Count;

            return new Dictionary<string, object>
            {
                { "id", c.Id },
                { "name", c.Name },
                { "platform", c.Platform },
                { "status", c.Status ?? "ACTIVE" },
                { "budget", 0m },
                { "spend", 0m },
                { "clicks", c.Clicks },
                { "impressions", c.Impressions },
                { "leadsCount", myLeadsCount },
                { "conversions", myConversions },
                { "revenue", myRevenue },
                { "externalCampaignId", c.ExternalCampaignId ?? "" },
                { "isLegacy", c.IsLegacy },
                { "lastSyncedAt", c.LastSyncedAt?.ToString("o") ?? "" },
                { "syncStatus", c.SyncStatus ?? "SYNCED" },
                { "platformStatus", c.PlatformStatus ?? c.Status ?? "ACTIVE" },
                { "placements", c.Placements ?? "" },
                { "createdAt", c.CreatedAt.ToString("o") }
            };
        }).ToList();
    }

    public async Task<PlatformCampaignResultDto> CreatePlatformCampaignAsync(CreatePlatformCampaignDto dto, string email)
    {
        var userEmail = email.Trim().ToLower();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == userEmail);
        if (user == null || user.WorkspaceId == null)
        {
            throw new KeyNotFoundException("User workspace not found");
        }

        var workspaceId = user.WorkspaceId.Value;
        var platform = (dto.Platform ?? "Meta").Trim();

        _logger.LogInformation("Creating campaign on platform '{Platform}' for workspace {WorkspaceId} by user {Email}...", platform, workspaceId, email);

        if (platform.Equals("Meta", StringComparison.OrdinalIgnoreCase) || platform.Contains("Facebook") || platform.Contains("Instagram"))
        {
            return await _metaAdsService.CreateFullPlatformCampaignAsync(dto, workspaceId);
        }
        else if (platform.Equals("Google", StringComparison.OrdinalIgnoreCase) || platform.Contains("Google Ads"))
        {
            return await _googleAdsService.CreateCampaignAsync(dto, workspaceId);
        }
        else
        {
            throw new NotSupportedException($"Platform '{dto.Platform}' is not supported for automated API campaign creation. Please use Meta Ads or Google Ads.");
        }
    }

    public async Task<object?> GetCampaignDetailsAsync(long id, string email)
    {
        var userEmail = email.Trim().ToLower();
        var user = await _context.Users
            .Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.Email == userEmail);

        if (user == null || user.WorkspaceId == null)
        {
            throw new KeyNotFoundException("User workspace not found");
        }

        var campaign = await _context.Campaigns
            .FirstOrDefaultAsync(c => c.Id == id && c.WorkspaceId == user.WorkspaceId);

        if (campaign == null)
        {
            return null;
        }

        var isAdminOrManager = user.Roles.Any(r => 
            r.Name.ToUpper().Contains("ADMIN") || 
            r.Name.ToUpper().Contains("MANAGER")
        );

        // Fetch leads tied to this campaign
        var leadsQuery = _context.Leads
            .Include(l => l.AssignedTo)
            .Where(l => l.WorkspaceId == user.WorkspaceId && (l.CampaignId == id || (l.CampaignName != null && l.CampaignName == campaign.Name)));

        if (!isAdminOrManager)
        {
            leadsQuery = leadsQuery.Where(l => l.AssignedToId == user.Id);
        }

        var rawLeads = await leadsQuery
            .OrderByDescending(l => l.CreatedAt)
            .Take(100)
            .ToListAsync();

        var convertedLeads = rawLeads.Where(l => IsConvertedStatus(l.Status)).ToList();
        var dynamicRevenue = (decimal)convertedLeads
            .Where(l => l.ProposalAmount.HasValue && l.ProposalAmount.Value > 0)
            .Sum(l => l.ProposalAmount!.Value);
        var dynamicConversions = Math.Max(campaign.Conversions, convertedLeads.Count);
        var dynamicLeadsCount = Math.Max(campaign.LeadsCount, rawLeads.Count);

        var leads = rawLeads.Select(l => new
        {
            id = l.Id,
            name = l.Name,
            email = l.Email,
            phone = l.Phone,
            status = l.Status,
            dealValue = l.ProposalAmount,
            isConverted = IsConvertedStatus(l.Status),
            sourcePlatform = l.SourcePlatform,
            assignedToName = l.AssignedTo != null ? l.AssignedTo.FullName : null,
            createdAt = l.CreatedAt.ToString("o")
        }).ToList();

        var ctr = campaign.Impressions > 0 ? ((decimal)campaign.Clicks / campaign.Impressions) * 100m : 0m;
        var cpc = campaign.Clicks > 0 ? (campaign.Spend / campaign.Clicks) : 0m;
        var cpa = dynamicConversions > 0 ? (campaign.Spend / dynamicConversions) : 0m;
        var roas = campaign.Spend > 0 ? (dynamicRevenue / campaign.Spend) : 0m;
        var conversionRate = campaign.Clicks > 0 ? ((decimal)dynamicConversions / campaign.Clicks) * 100m : 0m;
        var leadConversionRate = dynamicLeadsCount > 0 ? ((decimal)dynamicConversions / dynamicLeadsCount) * 100m : 0m;
        var profit = dynamicRevenue - campaign.Spend;
        var budgetUsedPercent = campaign.Budget > 0 ? (campaign.Spend / campaign.Budget) * 100m : 0m;

        return new
        {
            campaign = new
            {
                id = campaign.Id,
                name = campaign.Name,
                platform = campaign.Platform,
                status = campaign.Status ?? "ACTIVE",
                budget = campaign.Budget,
                spend = campaign.Spend,
                clicks = campaign.Clicks,
                impressions = campaign.Impressions,
                leadsCount = dynamicLeadsCount,
                conversions = dynamicConversions,
                revenue = dynamicRevenue,
                externalCampaignId = campaign.ExternalCampaignId,
                adAccountId = campaign.AdAccountId,
                objective = campaign.Objective,
                placements = campaign.Placements,
                isLegacy = campaign.IsLegacy,
                lastSyncedAt = campaign.LastSyncedAt?.ToString("o"),
                syncStatus = campaign.SyncStatus,
                syncError = campaign.SyncError,
                platformStatus = campaign.PlatformStatus,
                createdAt = campaign.CreatedAt.ToString("o")
            },
            metrics = new
            {
                ctr = Math.Round(ctr, 2),
                cpc = Math.Round(cpc, 2),
                cpa = Math.Round(cpa, 2),
                roas = Math.Round(roas, 2),
                conversionRate = Math.Round(conversionRate, 2),
                leadConversionRate = Math.Round(leadConversionRate, 2),
                profit = Math.Round(profit, 2),
                budgetUsedPercent = Math.Round(budgetUsedPercent, 1)
            },
            leads = leads
        };
    }

    private static bool IsConvertedStatus(string? status)
    {
        if (string.IsNullOrWhiteSpace(status)) return false;
        var s = status.Trim();
        return s.Equals("Converted", StringComparison.OrdinalIgnoreCase) ||
               s.Equals("Closed Won", StringComparison.OrdinalIgnoreCase) ||
               s.Equals("Closed_Won", StringComparison.OrdinalIgnoreCase) ||
               s.Equals("Won", StringComparison.OrdinalIgnoreCase) ||
               s.Equals("Payment Completed", StringComparison.OrdinalIgnoreCase) ||
               s.Equals("Payment_Completed", StringComparison.OrdinalIgnoreCase);
    }

    public async Task<Campaign> UpdateCampaignAsync(long id, Campaign updated, string email)
    {
        var userEmail = email.Trim().ToLower();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == userEmail);
        if (user == null || user.WorkspaceId == null)
        {
            throw new KeyNotFoundException("User workspace not found");
        }

        var campaign = await _context.Campaigns
            .FirstOrDefaultAsync(c => c.Id == id && c.WorkspaceId == user.WorkspaceId);

        if (campaign == null)
        {
            throw new KeyNotFoundException("Campaign not found");
        }

        // Only update allowable settings - Never allow manual override of platform ad metrics
        campaign.Name = updated.Name ?? campaign.Name;
        
        if (updated.Budget != campaign.Budget && updated.Budget >= 0)
        {
            await UpdateCampaignBudgetAsync(id, updated.Budget, email);
        }

        if (!string.IsNullOrWhiteSpace(updated.Status) && !updated.Status.Equals(campaign.Status, StringComparison.OrdinalIgnoreCase))
        {
            await UpdateCampaignStatusAsync(id, updated.Status, email);
        }

        await _context.SaveChangesAsync();
        return campaign;
    }

    public async Task<Campaign> UpdateCampaignStatusAsync(long id, string status, string email)
    {
        var userEmail = email.Trim().ToLower();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == userEmail);
        if (user == null || user.WorkspaceId == null)
        {
            throw new KeyNotFoundException("User workspace not found");
        }

        var campaign = await _context.Campaigns
            .FirstOrDefaultAsync(c => c.Id == id && c.WorkspaceId == user.WorkspaceId);

        if (campaign == null)
        {
            throw new KeyNotFoundException("Campaign not found");
        }

        var targetStatus = status.ToUpperInvariant();

        // If connected to a live platform, mutate on platform first
        if (!string.IsNullOrWhiteSpace(campaign.ExternalCampaignId))
        {
            try
            {
                if (campaign.Platform.ToLower().Contains("meta") || campaign.Platform.ToLower().Contains("facebook"))
                {
                    await _metaAdsService.UpdatePlatformCampaignStatusAsync(campaign.ExternalCampaignId, targetStatus);
                }
                else if (campaign.Platform.ToLower().Contains("google"))
                {
                    var accountId = campaign.AdAccountId ?? "";
                    await _googleAdsService.UpdateCampaignStatusAsync(accountId, campaign.ExternalCampaignId, targetStatus);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to update status on {Platform} API for campaign {CampaignId}", campaign.Platform, campaign.ExternalCampaignId);
                throw new HttpRequestException($"Failed to update status on {campaign.Platform}: {ex.Message}");
            }
        }

        campaign.Status = targetStatus;
        campaign.PlatformStatus = targetStatus;
        await _context.SaveChangesAsync();
        return campaign;
    }

    public async Task<Campaign> UpdateCampaignBudgetAsync(long id, decimal budget, string email)
    {
        var userEmail = email.Trim().ToLower();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == userEmail);
        if (user == null || user.WorkspaceId == null)
        {
            throw new KeyNotFoundException("User workspace not found");
        }

        var campaign = await _context.Campaigns
            .FirstOrDefaultAsync(c => c.Id == id && c.WorkspaceId == user.WorkspaceId);

        if (campaign == null)
        {
            throw new KeyNotFoundException("Campaign not found");
        }

        // If connected to a live platform, mutate budget on platform
        if (!string.IsNullOrWhiteSpace(campaign.ExternalCampaignId))
        {
            try
            {
                if (campaign.Platform.ToLower().Contains("meta") || campaign.Platform.ToLower().Contains("facebook"))
                {
                    await _metaAdsService.UpdatePlatformCampaignBudgetAsync(campaign.ExternalCampaignId, budget);
                }
                else if (campaign.Platform.ToLower().Contains("google"))
                {
                    var accountId = campaign.AdAccountId ?? "";
                    await _googleAdsService.UpdateCampaignBudgetAsync(accountId, campaign.ExternalCampaignId, budget);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to update budget on {Platform} API for campaign {CampaignId}", campaign.Platform, campaign.ExternalCampaignId);
                throw new HttpRequestException($"Failed to update budget on {campaign.Platform}: {ex.Message}");
            }
        }

        campaign.Budget = budget;
        await _context.SaveChangesAsync();
        return campaign;
    }

    public async Task<bool> DeleteCampaignAsync(long id, string email)
    {
        var userEmail = email.Trim().ToLower();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == userEmail);
        if (user == null || user.WorkspaceId == null)
        {
            throw new KeyNotFoundException("User workspace not found");
        }

        var campaign = await _context.Campaigns
            .FirstOrDefaultAsync(c => c.Id == id && c.WorkspaceId == user.WorkspaceId);

        if (campaign == null)
        {
            return false;
        }

        // Dissociate leads
        var leads = await _context.Leads.Where(l => l.CampaignId == id).ToListAsync();
        foreach (var l in leads)
        {
            l.CampaignId = null;
        }

        _context.Campaigns.Remove(campaign);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<CampaignSyncStatusDto> GetSyncStatusAsync(string email)
    {
        var userEmail = email.Trim().ToLower();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == userEmail);
        if (user == null || user.WorkspaceId == null)
        {
            throw new KeyNotFoundException("User workspace not found");
        }

        var workspaceId = user.WorkspaceId.Value;

        // Meta status
        bool isMetaConnected = false;
        string? metaAccountName = null;
        string? lastMetaError = null;

        try
        {
            var metaStatus = await _metaAdsService.GetStatusAsync();
            isMetaConnected = metaStatus.IsConfigured && metaStatus.IsUserTokenValid;
            metaAccountName = metaStatus.AdAccountId;
            lastMetaError = metaStatus.TokenValidationMessage;
        }
        catch (Exception ex)
        {
            lastMetaError = ex.Message;
        }

        // Google status
        bool isGoogleConnected = false;
        string? googleAccountName = null;
        string? lastGoogleError = null;

        try
        {
            var googleStatus = await _googleAdsService.GetStatusAsync();
            isGoogleConnected = googleStatus.IsConfigured && googleStatus.IsAccessTokenValid;
            googleAccountName = googleStatus.CustomerId;
            lastGoogleError = googleStatus.ValidationMessage;
        }
        catch (Exception ex)
        {
            lastGoogleError = ex.Message;
        }

        var latestSync = await _context.Campaigns
            .Where(c => c.WorkspaceId == workspaceId && c.LastSyncedAt != null)
            .OrderByDescending(c => c.LastSyncedAt)
            .Select(c => c.LastSyncedAt)
            .FirstOrDefaultAsync();

        var totalSynced = await _context.Campaigns
            .CountAsync(c => c.WorkspaceId == workspaceId && !c.IsLegacy);

        return new CampaignSyncStatusDto
        {
            LastSyncedAt = latestSync,
            IsMetaConnected = isMetaConnected,
            IsGoogleConnected = isGoogleConnected,
            MetaAccountName = metaAccountName,
            GoogleAccountName = googleAccountName,
            LastMetaError = lastMetaError,
            LastGoogleError = lastGoogleError,
            TotalCampaignsSynced = totalSynced
        };
    }

    public async Task<List<AdAccountInfoDto>> GetConnectedAdAccountsAsync(string email, string? platform = null)
    {
        var result = new List<AdAccountInfoDto>();

        if (string.IsNullOrWhiteSpace(platform) || platform.Equals("Meta", StringComparison.OrdinalIgnoreCase))
        {
            try
            {
                var metaAccounts = await _metaAdsService.ListConnectedAdAccountsWithPagesAsync();
                result.AddRange(metaAccounts);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to load Meta ad accounts");
            }
        }

        if (string.IsNullOrWhiteSpace(platform) || platform.Equals("Google", StringComparison.OrdinalIgnoreCase))
        {
            try
            {
                var googleAccounts = await _googleAdsService.ListConnectedAdAccountsAsync();
                result.AddRange(googleAccounts);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to load Google ad accounts");
            }
        }

        return result;
    }

    public async Task<CampaignSyncStatusDto> SyncWorkspaceCampaignsAsync(string email, string? platform = null)
    {
        var userEmail = email.Trim().ToLower();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == userEmail);
        if (user == null || user.WorkspaceId == null)
        {
            throw new KeyNotFoundException("User workspace not found");
        }

        var workspaceId = user.WorkspaceId.Value;
        _logger.LogInformation("Orchestrating campaign sync for workspace {WorkspaceId} (Platform: {Platform})...", workspaceId, platform ?? "All");

        if (string.IsNullOrWhiteSpace(platform) || platform.Equals("Meta", StringComparison.OrdinalIgnoreCase))
        {
            try
            {
                await _metaAdsService.SyncWorkspaceMetaAsync(workspaceId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during manual Meta sync for workspace {WorkspaceId}", workspaceId);
            }
        }

        if (string.IsNullOrWhiteSpace(platform) || platform.Equals("Google", StringComparison.OrdinalIgnoreCase))
        {
            try
            {
                await _googleAdsService.SyncWorkspaceGoogleAsync(workspaceId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during manual Google sync for workspace {WorkspaceId}", workspaceId);
            }
        }

        return await GetSyncStatusAsync(email);
    }
}

