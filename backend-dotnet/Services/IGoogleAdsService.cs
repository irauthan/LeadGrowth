using LeadGrowth.DTOs;

namespace LeadGrowth.Services;

public interface IGoogleAdsService
{
    /// <summary>
    /// Refreshes the OAuth 2.0 access token using the long-lived refresh token.
    /// Caches the token in-memory with expiration tracking.
    /// </summary>
    Task<string> RefreshAccessTokenAsync(bool forceRefresh = false);

    /// <summary>
    /// Lists all campaigns for the specified Google Ads customer account using GAQL.
    /// </summary>
    Task<List<GoogleCampaignDto>> ListCampaignsAsync(string? customerId = null);

    /// <summary>
    /// Retrieves aggregated campaign performance metrics and daily breakdowns using GAQL.
    /// </summary>
    Task<GoogleCampaignMetricsSummaryDto> GetCampaignMetricsAsync(string? customerId = null, string? campaignId = null, string? dateRange = "LAST_30_DAYS");

    /// <summary>
    /// Retrieves lead form submissions submitted within the Google Ads 60-day retention window.
    /// </summary>
    Task<List<GoogleLeadDto>> ListLeadFormSubmissionsAsync(string? customerId = null, int daysLookback = 60);

    /// <summary>
    /// Executes a full synchronization of Google Ads campaigns, daily metrics, and leads into the workspace database.
    /// </summary>
    Task<GoogleSyncResultDto> SyncWorkspaceGoogleAsync(long workspaceId, string? customerId = null);

    /// <summary>
    /// Creates a Campaign and CampaignBudget on Google Ads API and persists the record into LeadGrowth DB.
    /// </summary>
    Task<PlatformCampaignResultDto> CreateCampaignAsync(CreatePlatformCampaignDto dto, long workspaceId);

    /// <summary>
    /// Mutates campaign status on Google Ads API (ENABLED / PAUSED).
    /// </summary>
    Task<bool> UpdateCampaignStatusAsync(string customerId, string campaignId, string status);

    /// <summary>
    /// Mutates campaign budget on Google Ads API.
    /// </summary>
    Task<bool> UpdateCampaignBudgetAsync(string customerId, string campaignId, decimal dailyBudget);

    /// <summary>
    /// Lists accessible Google Ads Customer Accounts / Ad Accounts.
    /// </summary>
    Task<List<AdAccountInfoDto>> ListConnectedAdAccountsAsync();

    /// <summary>
    /// Checks configuration status and tests token / API connectivity.
    /// </summary>
    Task<GoogleIntegrationStatusDto> GetStatusAsync(string? customerId = null);

    /// <summary>
    /// Gets token health, caching, and expiration status.
    /// </summary>
    Task<GoogleTokenStatusDto> GetTokenStatusAsync();
}
