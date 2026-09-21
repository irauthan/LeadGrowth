using LeadGrowth.DTOs;

namespace LeadGrowth.Services;

public interface IMetaAdsService
{
    /// <summary>
    /// PART A - 1. Create campaign: POST /act_{ad_account_id}/campaigns
    /// </summary>
    Task<MetaIdResponse> CreateCampaignAsync(CreateMetaCampaignDto dto, string? userToken = null, string? adAccountId = null);

    /// <summary>
    /// PART A - 2. Create ad set: POST /act_{ad_account_id}/adsets
    /// </summary>
    Task<MetaIdResponse> CreateAdSetAsync(CreateMetaAdSetDto dto, string? userToken = null, string? adAccountId = null);

    /// <summary>
    /// PART A - 3. List campaigns: GET /act_{ad_account_id}/campaigns
    /// </summary>
    Task<List<MetaCampaignItem>> ListCampaignsAsync(string? userToken = null, string? adAccountId = null);

    /// <summary>
    /// PART A - 4. Get campaign insights: GET /{campaign_id}/insights
    /// </summary>
    Task<MetaInsightSummaryDto> GetCampaignInsightsAsync(string campaignId, string? userToken = null, bool dailyTrend = false, string? datePreset = "last_30d");

    /// <summary>
    /// PART B - 5. Create lead form: POST /{page_id}/leadgen_forms (requires Page Access Token)
    /// </summary>
    Task<MetaIdResponse> CreateLeadFormAsync(CreateMetaLeadFormDto dto, string? pageToken = null, string? pageId = null);

    /// <summary>
    /// PART B - 6. List lead forms for a page: GET /{page_id}/leadgen_forms (requires Page Access Token)
    /// </summary>
    Task<List<MetaLeadFormItem>> ListLeadFormsAsync(string? pageToken = null, string? pageId = null);

    /// <summary>
    /// PART B - 7. Get leads for a form: GET /{form_id}/leads (requires Page Access Token)
    /// </summary>
    Task<List<MetaLeadItem>> GetLeadsForFormAsync(string formId, string? pageToken = null);

    /// <summary>
    /// Helper: Get Page Access Token from Business Manager owned pages: GET /{business_manager_id}/owned_pages
    /// </summary>
    Task<string?> GetPageAccessTokenFromBusinessAsync(string businessManagerId, string pageId, string? userToken = null);

    /// <summary>
    /// Full Sync: Pulls campaigns, insights, lead forms, and leads into LeadGrowth database with deduplication.
    /// </summary>
    Task<MetaSyncResultDto> SyncWorkspaceMetaAsync(long workspaceId, string? userToken = null, string? pageToken = null, string? adAccountId = null, string? pageId = null);

    /// <summary>
    /// Checks configuration status and tests token validity.
    /// </summary>
    Task<MetaIntegrationStatusDto> GetStatusAsync(string? userToken = null, string? pageToken = null, string? adAccountId = null, string? pageId = null);

    /// <summary>
    /// Exchanges a short-lived User Access Token for a long-lived (~60 days) token,
    /// stores it in the MetaTokens table, and triggers a Page Access Token refresh.
    /// </summary>
    Task<string> ExchangeForLongLivedTokenAsync(string shortLivedToken);

    /// <summary>
    /// Refreshes the Page Access Token using the active long-lived User Access Token and stores it in the MetaTokens table.
    /// </summary>
    Task<string?> RefreshPageAccessTokenAsync(string? userToken = null);

    /// <summary>
    /// Gets token health and expiration status for User and Page tokens.
    /// </summary>
    Task<MetaTokenStatusDto> GetTokenStatusAsync();

    /// <summary>
    /// Proactively checks stored User token expiration; if within threshold days (default: 5 days), re-exchanges token.
    /// </summary>
    Task CheckAndRefreshTokensBeforeExpiryAsync(int daysThreshold = 5);

    /// <summary>
    /// Resolves the effective User Access Token (checking database store first, then config bootstrap seed).
    /// </summary>
    Task<string> GetEffectiveUserTokenAsync(string? overrideToken = null);

    /// <summary>
    /// Resolves the effective Page Access Token (checking database store first, then config bootstrap seed).
    /// </summary>
    Task<string> GetEffectivePageTokenAsync(string? overrideToken = null);

    /// <summary>
    /// Deletes all stored tokens from the MetaTokens database table.
    /// </summary>
    Task ClearTokensAsync();

    /// <summary>
    /// Creates a complete campaign hierarchy (Campaign -> AdSet with FB/IG placements -> Creative -> Ad) and saves in local DB.
    /// </summary>
    Task<PlatformCampaignResultDto> CreateFullPlatformCampaignAsync(CreatePlatformCampaignDto dto, long workspaceId, string? userToken = null);

    /// <summary>
    /// Updates campaign status on Meta Graph API (ACTIVE / PAUSED).
    /// </summary>
    Task<bool> UpdatePlatformCampaignStatusAsync(string campaignId, string status, string? userToken = null);

    /// <summary>
    /// Updates campaign daily budget on Meta Graph API.
    /// </summary>
    Task<bool> UpdatePlatformCampaignBudgetAsync(string campaignId, decimal dailyBudget, string? userToken = null);

    /// <summary>
    /// Lists connected Meta Ad Accounts along with Facebook Pages and Instagram Accounts.
    /// </summary>
    Task<List<AdAccountInfoDto>> ListConnectedAdAccountsWithPagesAsync(string? userToken = null);

    /// <summary>
    /// Clears existing DB tokens and re-seeds long-lived tokens from appsettings.json.
    /// </summary>
    Task<MetaTokenStatusDto> ReseedFromConfigAsync(bool force = true);
}
