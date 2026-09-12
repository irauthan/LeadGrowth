using System.Net.Http.Json;
using System.Text.Json;
using LeadGrowth.Data;
using LeadGrowth.DTOs;
using LeadGrowth.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace LeadGrowth.Services;

public class MetaAdsService : IMetaAdsService
{
    private readonly HttpClient _httpClient;
    private readonly IOptionsMonitor<MetaAdsOptions> _optionsMonitor;
    private readonly LeadGrowthDbContext _context;
    private readonly ILogger<MetaAdsService> _logger;

    private MetaAdsOptions _options => _optionsMonitor.CurrentValue;

    private readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public MetaAdsService(
        IHttpClientFactory httpClientFactory,
        IOptionsMonitor<MetaAdsOptions> optionsMonitor,
        LeadGrowthDbContext context,
        ILogger<MetaAdsService> logger)
    {
        _httpClient = httpClientFactory.CreateClient("MetaGraphApi");
        _optionsMonitor = optionsMonitor;
        _context = context;
        _logger = logger;
    }

    private string BuildUrl(string path)
    {
        var baseUrl = string.IsNullOrWhiteSpace(_options.BaseUrl) ? "https://graph.facebook.com" : _options.BaseUrl.TrimEnd('/');
        var version = string.IsNullOrWhiteSpace(_options.ApiVersion) ? "v25.0" : _options.ApiVersion;
        var cleanPath = path.TrimStart('/');
        return $"{baseUrl}/{version}/{cleanPath}";
    }

    private string GetEffectiveAdAccountId(string? overrideId)
    {
        var accountId = !string.IsNullOrWhiteSpace(overrideId) ? overrideId.Trim() : _options.AdAccountId?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(accountId)) return string.Empty;
        return accountId.StartsWith("act_") ? accountId : $"act_{accountId}";
    }

    private string GetEffectivePageId(string? overridePageId) =>
        !string.IsNullOrWhiteSpace(overridePageId) ? overridePageId.Trim() : _options.PageId?.Trim() ?? string.Empty;

    #region Token Persistence, Resolution & Exchange (Lifecycle Management)

    /// <summary>
    /// Resolves the effective User Access Token:
    /// 1. Override token (if supplied)
    /// 2. If appsettings.json has a new UserAccessToken that is DIFFERENT from stored DB token, automatically exchange & update DB
    /// 3. If DB token exists and is valid (not expired), return it
    /// 4. Fallback to appsettings.json UserAccessToken (exchange for long-lived if possible)
    /// </summary>
    public async Task<string> GetEffectiveUserTokenAsync(string? overrideToken = null)
    {
        if (!string.IsNullOrWhiteSpace(overrideToken))
        {
            return overrideToken.Trim();
        }

        var configToken = _options.UserAccessToken?.Trim();
        MetaToken? dbToken = null;

        try
        {
            dbToken = await _context.MetaTokens
                .FirstOrDefaultAsync(t => t.TokenType == "User");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to query meta_tokens store for User token.");
        }

        // Case A: User has provided a new token in config that differs from stored DB token
        if (!string.IsNullOrWhiteSpace(configToken) && (dbToken == null || dbToken.AccessToken.Trim() != configToken))
        {
            _logger.LogInformation("New/updated Meta User Access Token detected in config. Triggering long-lived exchange and DB update...");
            if (!string.IsNullOrWhiteSpace(_options.AppId) && !string.IsNullOrWhiteSpace(_options.AppSecret))
            {
                try
                {
                    var longLived = await ExchangeForLongLivedTokenAsync(configToken);
                    return longLived;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Could not exchange new config token for long-lived token. Storing raw config token.");
                }
            }

            // Save new config token into DB
            try
            {
                if (dbToken == null)
                {
                    dbToken = new MetaToken
                    {
                        TokenType = "User",
                        AccessToken = configToken,
                        ExpiresAt = null,
                        UpdatedAt = DateTime.UtcNow
                    };
                    _context.MetaTokens.Add(dbToken);
                }
                else
                {
                    dbToken.AccessToken = configToken;
                    dbToken.ExpiresAt = null;
                    dbToken.UpdatedAt = DateTime.UtcNow;
                }
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to persist new config token into DB.");
            }

            return configToken;
        }

        // Case B: Stored DB token exists and is not expired
        if (dbToken != null && !string.IsNullOrWhiteSpace(dbToken.AccessToken))
        {
            if (!dbToken.ExpiresAt.HasValue || dbToken.ExpiresAt.Value > DateTime.UtcNow)
            {
                return dbToken.AccessToken.Trim();
            }

            _logger.LogWarning("Stored Meta User token in DB has expired on {ExpiresAt}. Checking config fallback...", dbToken.ExpiresAt);
        }

        // Case C: Fallback to config token
        if (!string.IsNullOrWhiteSpace(configToken))
        {
            if (!string.IsNullOrWhiteSpace(_options.AppId) && !string.IsNullOrWhiteSpace(_options.AppSecret))
            {
                try
                {
                    var exchanged = await ExchangeForLongLivedTokenAsync(configToken);
                    return exchanged;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to exchange config token on fallback.");
                }
            }
            return configToken;
        }

        return dbToken?.AccessToken.Trim() ?? string.Empty;
    }

    /// <summary>
    /// Resolves the effective Page Access Token:
    /// 1. Override token (if supplied)
    /// 2. If appsettings.json has a new PageAccessToken that differs from DB, updates DB
    /// 3. Persisted token in meta_tokens DB table
    /// 4. Re-fetched from User token via owned_pages or direct graph query
    /// 5. Bootstrap seed in appsettings.json
    /// </summary>
    public async Task<string> GetEffectivePageTokenAsync(string? overrideToken = null)
    {
        if (!string.IsNullOrWhiteSpace(overrideToken))
        {
            return overrideToken.Trim();
        }

        var configPageToken = _options.PageAccessToken?.Trim();
        MetaToken? dbToken = null;

        try
        {
            dbToken = await _context.MetaTokens
                .FirstOrDefaultAsync(t => t.TokenType == "Page");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to query meta_tokens store for Page token.");
        }

        // If config has updated page token differing from DB
        if (!string.IsNullOrWhiteSpace(configPageToken) && (dbToken == null || dbToken.AccessToken.Trim() != configPageToken))
        {
            _logger.LogInformation("New/updated Meta Page Access Token detected in config. Updating DB store...");
            try
            {
                if (dbToken == null)
                {
                    dbToken = new MetaToken
                    {
                        TokenType = "Page",
                        AccessToken = configPageToken,
                        ExpiresAt = null,
                        UpdatedAt = DateTime.UtcNow
                    };
                    _context.MetaTokens.Add(dbToken);
                }
                else
                {
                    dbToken.AccessToken = configPageToken;
                    dbToken.ExpiresAt = null;
                    dbToken.UpdatedAt = DateTime.UtcNow;
                }
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to save updated config Page token to DB.");
            }
            return configPageToken;
        }

        if (dbToken != null && !string.IsNullOrWhiteSpace(dbToken.AccessToken))
        {
            return dbToken.AccessToken.Trim();
        }

        // Try dynamically fetching page token using active user token
        var userToken = await GetEffectiveUserTokenAsync();
        if (!string.IsNullOrWhiteSpace(userToken))
        {
            try
            {
                var fetchedPageToken = await RefreshPageAccessTokenAsync(userToken);
                if (!string.IsNullOrWhiteSpace(fetchedPageToken))
                {
                    return fetchedPageToken;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to fetch Page Access Token dynamically using User token.");
            }
        }

        return configPageToken ?? string.Empty;
    }

    /// <summary>
    /// Deletes all stored tokens from the meta_tokens database table.
    /// </summary>
    public async Task ClearTokensAsync()
    {
        try
        {
            var existing = await _context.MetaTokens.ToListAsync();
            if (existing.Count > 0)
            {
                _context.MetaTokens.RemoveRange(existing);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Cleared {Count} token(s) from meta_tokens table.", existing.Count);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error clearing meta_tokens table.");
        }
    }

    /// <summary>
    /// Clears existing DB tokens and re-seeds long-lived tokens from appsettings.json.
    /// </summary>
    public async Task<MetaTokenStatusDto> ReseedFromConfigAsync(bool force = true)
    {
        if (force)
        {
            await ClearTokensAsync();
        }

        if (!string.IsNullOrWhiteSpace(_options.UserAccessToken))
        {
            var configToken = _options.UserAccessToken.Trim();
            _logger.LogInformation("ReseedFromConfigAsync: Exchanging config UserAccessToken for long-lived token...");
            await ExchangeForLongLivedTokenAsync(configToken);
        }

        if (!string.IsNullOrWhiteSpace(_options.PageAccessToken))
        {
            var existingPage = await _context.MetaTokens.FirstOrDefaultAsync(t => t.TokenType == "Page");
            if (existingPage == null)
            {
                _context.MetaTokens.Add(new MetaToken
                {
                    TokenType = "Page",
                    AccessToken = _options.PageAccessToken.Trim(),
                    ExpiresAt = null,
                    UpdatedAt = DateTime.UtcNow
                });
                await _context.SaveChangesAsync();
                _logger.LogInformation("ReseedFromConfigAsync: Stored config PageAccessToken fallback.");
            }
        }

        return await GetTokenStatusAsync();
    }

    /// <summary>
    /// Exchanges a short-lived User Access Token for a long-lived (~60 days) token,
    /// stores it in the MetaTokens table, and triggers a Page Access Token refresh.
    /// </summary>
    public async Task<string> ExchangeForLongLivedTokenAsync(string shortLivedToken)
    {
        if (string.IsNullOrWhiteSpace(shortLivedToken))
        {
            throw new ArgumentException("Token to exchange cannot be null or empty.", nameof(shortLivedToken));
        }

        if (string.IsNullOrWhiteSpace(_options.AppId) || string.IsNullOrWhiteSpace(_options.AppSecret))
        {
            _logger.LogWarning("Meta AppId or AppSecret is not configured. Cannot perform long-lived token exchange.");
            throw new InvalidOperationException("Meta AppId and AppSecret must be configured under MetaAds in appsettings.json to exchange tokens for long-lived tokens.");
        }

        var baseUrl = string.IsNullOrWhiteSpace(_options.BaseUrl) ? "https://graph.facebook.com" : _options.BaseUrl.TrimEnd('/');
        var version = string.IsNullOrWhiteSpace(_options.ApiVersion) ? "v25.0" : _options.ApiVersion;

        var exchangeUrl = $"{baseUrl}/{version}/oauth/access_token?" +
            $"grant_type=fb_exchange_token" +
            $"&client_id={Uri.EscapeDataString(_options.AppId.Trim())}" +
            $"&client_secret={Uri.EscapeDataString(_options.AppSecret.Trim())}" +
            $"&fb_exchange_token={Uri.EscapeDataString(shortLivedToken.Trim())}";

        var maskedTokenPrefix = shortLivedToken.Length > 15 ? shortLivedToken.Substring(0, 15) : shortLivedToken;
        _logger.LogInformation("Requesting Meta long-lived token exchange for AppId: {AppId} (Token prefix: {Prefix}...)",
            _options.AppId.Trim(), maskedTokenPrefix);

        using var request = new HttpRequestMessage(HttpMethod.Get, exchangeUrl);
        var response = await _httpClient.SendAsync(request);
        var content = await response.Content.ReadAsStringAsync();

        _logger.LogInformation("Meta token exchange API response (HTTP {StatusCode}): {Response}", response.StatusCode, content);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("Meta long-lived token exchange failed with status {StatusCode}: {Response}", response.StatusCode, content);
            throw new HttpRequestException($"Meta token exchange failed ({response.StatusCode}): {content}");
        }

        var tokenResponse = JsonSerializer.Deserialize<MetaOAuthTokenResponse>(content, _jsonOptions);
        if (tokenResponse == null || string.IsNullOrWhiteSpace(tokenResponse.AccessToken))
        {
            throw new InvalidOperationException($"Failed to deserialize long-lived token from Meta Graph API exchange response: {content}");
        }

        DateTime? expiresAt = null;
        if (tokenResponse.ExpiresIn.HasValue && tokenResponse.ExpiresIn.Value > 0)
        {
            expiresAt = DateTime.UtcNow.AddSeconds(tokenResponse.ExpiresIn.Value);
        }
        else
        {
            expiresAt = DateTime.UtcNow.AddDays(60);
        }

        // Upsert User token in meta_tokens DB table
        var existingToken = await _context.MetaTokens
            .FirstOrDefaultAsync(t => t.TokenType == "User");

        if (existingToken == null)
        {
            existingToken = new MetaToken
            {
                TokenType = "User",
                AccessToken = tokenResponse.AccessToken,
                ExpiresAt = expiresAt,
                UpdatedAt = DateTime.UtcNow
            };
            _context.MetaTokens.Add(existingToken);
        }
        else
        {
            existingToken.AccessToken = tokenResponse.AccessToken;
            existingToken.ExpiresAt = expiresAt;
            existingToken.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "Successfully exchanged and persisted long-lived Meta User Access Token. Expiry: {ExpiresAt:yyyy-MM-dd HH:mm:ss} UTC (~{Days:F0} days).",
            expiresAt, (expiresAt.Value - DateTime.UtcNow).TotalDays);

        // Also refresh Page Access Token automatically using this new long-lived User token
        try
        {
            await RefreshPageAccessTokenAsync(tokenResponse.AccessToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to automatically refresh Page token after User token exchange.");
        }

        return tokenResponse.AccessToken;
    }

    /// <summary>
    /// Refreshes the Page Access Token using the active long-lived User Access Token and stores it in the MetaTokens table.
    /// </summary>
    public async Task<string?> RefreshPageAccessTokenAsync(string? userToken = null)
    {
        var uToken = !string.IsNullOrWhiteSpace(userToken)
            ? userToken
            : await GetEffectiveUserTokenAsync();

        if (string.IsNullOrWhiteSpace(uToken))
        {
            _logger.LogWarning("Cannot refresh Page Access Token: No active User Access Token available.");
            return null;
        }

        var pageId = GetEffectivePageId(null);
        if (string.IsNullOrWhiteSpace(pageId))
        {
            _logger.LogWarning("Cannot refresh Page Access Token: No PageId configured.");
            return null;
        }

        string? pageAccessToken = null;

        // 1. Try Business Manager owned_pages if BusinessManagerId is configured
        var bmId = _options.BusinessManagerId;
        if (!string.IsNullOrWhiteSpace(bmId))
        {
            try
            {
                var bmUrl = BuildUrl($"{bmId}/owned_pages?fields=name,access_token&access_token={Uri.EscapeDataString(uToken)}");
                var bmResponse = await _httpClient.GetAsync(bmUrl);
                if (bmResponse.IsSuccessStatusCode)
                {
                    var bmContent = await bmResponse.Content.ReadAsStringAsync();
                    var bmResult = JsonSerializer.Deserialize<MetaOwnedPagesResponse>(bmContent, _jsonOptions);
                    var targetPage = bmResult?.Data?.FirstOrDefault(p => p.Id == pageId);
                    if (targetPage != null && !string.IsNullOrWhiteSpace(targetPage.AccessToken))
                    {
                        pageAccessToken = targetPage.AccessToken;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to query Business Manager owned_pages for Page ID {PageId}", pageId);
            }
        }

        // 2. Try direct Page endpoint /{page_id}?fields=access_token
        if (string.IsNullOrWhiteSpace(pageAccessToken))
        {
            try
            {
                var pageUrl = BuildUrl($"{pageId}?fields=access_token&access_token={Uri.EscapeDataString(uToken)}");
                var pageResponse = await _httpClient.GetAsync(pageUrl);
                if (pageResponse.IsSuccessStatusCode)
                {
                    var pageContent = await pageResponse.Content.ReadAsStringAsync();
                    var pageObj = JsonSerializer.Deserialize<MetaOwnedPageItem>(pageContent, _jsonOptions);
                    if (pageObj != null && !string.IsNullOrWhiteSpace(pageObj.AccessToken))
                    {
                        pageAccessToken = pageObj.AccessToken;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Direct page token query for Page ID {PageId} failed.", pageId);
            }
        }

        // 3. Fallback: Query /me/accounts?fields=id,name,access_token
        if (string.IsNullOrWhiteSpace(pageAccessToken))
        {
            try
            {
                var accountsUrl = BuildUrl($"me/accounts?fields=id,name,access_token&access_token={Uri.EscapeDataString(uToken)}");
                var accountsResponse = await _httpClient.GetAsync(accountsUrl);
                if (accountsResponse.IsSuccessStatusCode)
                {
                    var accountsContent = await accountsResponse.Content.ReadAsStringAsync();
                    var accountsResult = JsonSerializer.Deserialize<MetaOwnedPagesResponse>(accountsContent, _jsonOptions);
                    var targetPage = accountsResult?.Data?.FirstOrDefault(p => p.Id == pageId);
                    if (targetPage != null && !string.IsNullOrWhiteSpace(targetPage.AccessToken))
                    {
                        pageAccessToken = targetPage.AccessToken;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "User accounts query for Page ID {PageId} failed.", pageId);
            }
        }

        if (!string.IsNullOrWhiteSpace(pageAccessToken))
        {
            var existingPageToken = await _context.MetaTokens
                .FirstOrDefaultAsync(t => t.TokenType == "Page");

            if (existingPageToken == null)
            {
                existingPageToken = new MetaToken
                {
                    TokenType = "Page",
                    AccessToken = pageAccessToken,
                    ExpiresAt = null, // Long-lived page tokens do not expire as long as user permissions hold
                    UpdatedAt = DateTime.UtcNow
                };
                _context.MetaTokens.Add(existingPageToken);
            }
            else
            {
                existingPageToken.AccessToken = pageAccessToken;
                existingPageToken.ExpiresAt = null;
                existingPageToken.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            _logger.LogInformation("Successfully refreshed and stored permanent Meta Page Access Token for Page ID {PageId}.", pageId);
            return pageAccessToken;
        }

        _logger.LogWarning("Unable to resolve Page Access Token for Page ID {PageId} with current User token.", pageId);
        return null;
    }

    /// <summary>
    /// Proactively checks stored User token expiration; if within threshold days (default: 5 days), re-exchanges token.
    /// </summary>
    public async Task CheckAndRefreshTokensBeforeExpiryAsync(int daysThreshold = 5)
    {
        var userToken = await _context.MetaTokens
            .FirstOrDefaultAsync(t => t.TokenType == "User");

        if (userToken == null)
        {
            // First-time seed check if config token exists
            if (!string.IsNullOrWhiteSpace(_options.UserAccessToken))
            {
                _logger.LogInformation("No Meta User token found in DB store. Triggering initial seed...");
                await GetEffectiveUserTokenAsync();
            }
            return;
        }

        if (!userToken.ExpiresAt.HasValue)
        {
            _logger.LogDebug("Stored Meta User token has no expiration date set. Skipping proactive auto-exchange.");
            return;
        }

        var timeRemaining = userToken.ExpiresAt.Value - DateTime.UtcNow;
        if (timeRemaining <= TimeSpan.FromDays(daysThreshold))
        {
            _logger.LogInformation(
                "Meta User Access Token is within {Threshold} days of expiration ({Days:F1} days left, ExpiresAt: {ExpiresAt:yyyy-MM-dd HH:mm:ss} UTC). Triggering proactive auto-exchange...",
                daysThreshold, timeRemaining.TotalDays, userToken.ExpiresAt.Value);

            try
            {
                await ExchangeForLongLivedTokenAsync(userToken.AccessToken);
                _logger.LogInformation("Proactive Meta User Access Token refresh completed successfully.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Proactive Meta token refresh failed. Will retry on next scheduled check.");
            }
        }
        else
        {
            _logger.LogDebug(
                "Meta User Access Token is healthy ({Days:F1} days remaining until {ExpiresAt:yyyy-MM-dd HH:mm:ss} UTC).",
                timeRemaining.TotalDays, userToken.ExpiresAt.Value);
        }
    }

    /// <summary>
    /// Gets token health and expiration status for User and Page tokens.
    /// </summary>
    public async Task<MetaTokenStatusDto> GetTokenStatusAsync()
    {
        var userDb = await _context.MetaTokens.AsNoTracking().FirstOrDefaultAsync(t => t.TokenType == "User");
        var pageDb = await _context.MetaTokens.AsNoTracking().FirstOrDefaultAsync(t => t.TokenType == "Page");

        string? uToken = userDb?.AccessToken;
        string uSource = "Database";
        if (string.IsNullOrWhiteSpace(uToken) && !string.IsNullOrWhiteSpace(_options.UserAccessToken))
        {
            uToken = _options.UserAccessToken;
            uSource = "Config";
        }

        string? pToken = pageDb?.AccessToken;
        string pSource = "Database";
        if (string.IsNullOrWhiteSpace(pToken) && !string.IsNullOrWhiteSpace(_options.PageAccessToken))
        {
            pToken = _options.PageAccessToken;
            pSource = "Config";
        }

        double? uExpiresInDays = null;
        bool uExpiringSoon = false;
        if (userDb?.ExpiresAt.HasValue == true)
        {
            uExpiresInDays = Math.Round((userDb.ExpiresAt.Value - DateTime.UtcNow).TotalDays, 1);
            uExpiringSoon = uExpiresInDays <= 5;
        }

        var isConfigured = !string.IsNullOrWhiteSpace(uToken) &&
            (!string.IsNullOrWhiteSpace(_options.AdAccountId) || !string.IsNullOrWhiteSpace(_options.PageId));

        var status = new MetaTokenStatusDto
        {
            IsConfigured = isConfigured,
            UserToken = new MetaTokenInfo
            {
                HasToken = !string.IsNullOrWhiteSpace(uToken),
                MaskedToken = MaskToken(uToken),
                ExpiresAt = userDb?.ExpiresAt,
                ExpiresInDays = uExpiresInDays,
                IsExpiringSoon = uExpiringSoon,
                UpdatedAt = userDb?.UpdatedAt,
                Source = string.IsNullOrWhiteSpace(uToken) ? "None" : uSource
            },
            PageToken = new MetaTokenInfo
            {
                HasToken = !string.IsNullOrWhiteSpace(pToken),
                MaskedToken = MaskToken(pToken),
                ExpiresAt = pageDb?.ExpiresAt,
                ExpiresInDays = null,
                IsExpiringSoon = false,
                UpdatedAt = pageDb?.UpdatedAt,
                Source = string.IsNullOrWhiteSpace(pToken) ? "None" : pSource
            },
            LastRefreshedAt = userDb?.UpdatedAt ?? pageDb?.UpdatedAt,
            Message = !string.IsNullOrWhiteSpace(uToken)
                ? (uExpiringSoon ? "User token is expiring within 5 days. Auto-refresh will trigger soon." : "Meta tokens are active and healthy.")
                : "No User Access Token found. Please configure UserAccessToken in appsettings.json or exchange a token."
        };

        return status;
    }

    private static string? MaskToken(string? token)
    {
        if (string.IsNullOrWhiteSpace(token)) return null;
        if (token.Length <= 8) return "********";
        return $"{token.Substring(0, 4)}...{token.Substring(token.Length - 4)}";
    }

    #endregion

    #region PART A — Campaign & Performance Data

    /// <summary>
    /// PART A - 1: POST /act_{ad_account_id}/campaigns
    /// </summary>
    public async Task<MetaIdResponse> CreateCampaignAsync(CreateMetaCampaignDto dto, string? userToken = null, string? adAccountId = null)
    {
        var account = GetEffectiveAdAccountId(adAccountId ?? dto.AdAccountId);
        if (string.IsNullOrWhiteSpace(account))
        {
            throw new ArgumentException("Ad Account ID is required to create a Meta campaign.");
        }

        var url = BuildUrl($"{account}/campaigns");
        var specialCategoriesJson = JsonSerializer.Serialize(dto.SpecialAdCategories ?? new List<string> { "NONE" });

        return await SendWithAutoRefreshAsync<MetaIdResponse>(
            token =>
            {
                var formParams = new Dictionary<string, string>
                {
                    { "name", dto.Name },
                    { "objective", dto.Objective ?? "OUTCOME_LEADS" },
                    { "status", dto.Status ?? "PAUSED" },
                    { "special_ad_categories", specialCategoriesJson },
                    { "is_adset_budget_sharing_enabled", dto.IsAdsetBudgetSharingEnabled.ToString().ToLower() },
                    { "access_token", token }
                };

                if (dto.DailyBudget.HasValue && dto.DailyBudget.Value > 0)
                {
                    var budgetCents = (long)Math.Round(dto.DailyBudget.Value * 100);
                    formParams.Add("daily_budget", budgetCents.ToString());
                }

                return new HttpRequestMessage(HttpMethod.Post, url)
                {
                    Content = new FormUrlEncodedContent(formParams)
                };
            },
            isPageToken: false,
            explicitToken: userToken ?? dto.UserAccessToken,
            actionName: "CreateCampaign");
    }

    /// <summary>
    /// PART A - 2: POST /act_{ad_account_id}/adsets
    /// </summary>
    public async Task<MetaIdResponse> CreateAdSetAsync(CreateMetaAdSetDto dto, string? userToken = null, string? adAccountId = null)
    {
        var account = GetEffectiveAdAccountId(adAccountId ?? dto.AdAccountId);
        if (string.IsNullOrWhiteSpace(account))
        {
            throw new ArgumentException("Ad Account ID is required to create a Meta Ad Set.");
        }

        var pageId = GetEffectivePageId(dto.PageId);
        var url = BuildUrl($"{account}/adsets");

        var promotedObject = new MetaPromotedObject { PageId = pageId };
        var targeting = new MetaTargeting
        {
            GeoLocations = new MetaGeoLocations { Countries = dto.TargetCountries ?? new List<string> { "US" } },
            AgeMin = dto.AgeMin,
            AgeMax = dto.AgeMax
        };

        var dailyBudgetCents = (long)Math.Round(dto.DailyBudget * 100);

        return await SendWithAutoRefreshAsync<MetaIdResponse>(
            token =>
            {
                var formParams = new Dictionary<string, string>
                {
                    { "name", dto.Name },
                    { "campaign_id", dto.CampaignId },
                    { "daily_budget", dailyBudgetCents.ToString() },
                    { "billing_event", dto.BillingEvent ?? "IMPRESSIONS" },
                    { "optimization_goal", dto.OptimizationGoal ?? "LEAD_GENERATION" },
                    { "promoted_object", JsonSerializer.Serialize(promotedObject) },
                    { "targeting", JsonSerializer.Serialize(targeting) },
                    { "status", dto.Status ?? "PAUSED" },
                    { "access_token", token }
                };

                if (!string.IsNullOrWhiteSpace(dto.BidStrategy))
                {
                    formParams.Add("bid_strategy", dto.BidStrategy);
                }

                return new HttpRequestMessage(HttpMethod.Post, url)
                {
                    Content = new FormUrlEncodedContent(formParams)
                };
            },
            isPageToken: false,
            explicitToken: userToken ?? dto.UserAccessToken,
            actionName: "CreateAdSet");
    }

    /// <summary>
    /// PART A - 3: GET /act_{ad_account_id}/campaigns
    /// </summary>
    public async Task<List<MetaCampaignItem>> ListCampaignsAsync(string? userToken = null, string? adAccountId = null)
    {
        var account = GetEffectiveAdAccountId(adAccountId);
        if (string.IsNullOrWhiteSpace(account))
        {
            throw new ArgumentException("Ad Account ID is required to list campaigns.");
        }

        var fields = "id,name,status,objective,daily_budget,lifetime_budget,budget_remaining,start_time,stop_time,created_time,updated_time";

        var result = await SendWithAutoRefreshAsync<MetaCampaignListResponse>(
            token =>
            {
                var url = BuildUrl($"{account}/campaigns?fields={fields}&access_token={Uri.EscapeDataString(token)}");
                return new HttpRequestMessage(HttpMethod.Get, url);
            },
            isPageToken: false,
            explicitToken: userToken,
            actionName: "ListCampaigns");

        return result?.Data ?? new List<MetaCampaignItem>();
    }

    /// <summary>
    /// PART A - 4: GET /{campaign_id}/insights
    /// </summary>
    public async Task<MetaInsightSummaryDto> GetCampaignInsightsAsync(
        string campaignId,
        string? userToken = null,
        bool dailyTrend = false,
        string? datePreset = "last_30d")
    {
        var fields = "impressions,clicks,spend,reach,frequency,cpc,cpm,ctr,actions,cost_per_action_type,date_start,date_stop";

        var result = await SendWithAutoRefreshAsync<MetaInsightsResponse>(
            token =>
            {
                var url = BuildUrl($"{campaignId}/insights?fields={fields}&access_token={Uri.EscapeDataString(token)}");
                if (dailyTrend)
                {
                    url += $"&time_increment=1&date_preset={Uri.EscapeDataString(datePreset ?? "last_30d")}";
                }
                return new HttpRequestMessage(HttpMethod.Get, url);
            },
            isPageToken: false,
            explicitToken: userToken,
            actionName: "GetCampaignInsights");

        var summary = new MetaInsightSummaryDto
        {
            CampaignId = campaignId,
            DailyBreakdown = result?.Data ?? new List<MetaInsightItem>()
        };

        if (result?.Data != null && result.Data.Count > 0)
        {
            foreach (var item in result.Data)
            {
                if (int.TryParse(item.Impressions, out var imp)) summary.Impressions += imp;
                if (int.TryParse(item.Clicks, out var clk)) summary.Clicks += clk;
                if (decimal.TryParse(item.Spend, out var sp)) summary.Spend += sp;
                if (int.TryParse(item.Reach, out var rch)) summary.Reach += rch;
                if (decimal.TryParse(item.Cpc, out var cpc)) summary.Cpc = cpc;
                if (decimal.TryParse(item.Cpm, out var cpm)) summary.Cpm = cpm;
                if (decimal.TryParse(item.Ctr, out var ctr)) summary.Ctr = ctr;
                if (decimal.TryParse(item.Frequency, out var freq)) summary.Frequency = freq;

                summary.DateStart ??= item.DateStart;
                summary.DateStop = item.DateStop;

                if (item.Actions != null)
                {
                    var leadAction = item.Actions.FirstOrDefault(a =>
                        a.ActionType.Equals("lead", StringComparison.OrdinalIgnoreCase) ||
                        a.ActionType.Equals("leads", StringComparison.OrdinalIgnoreCase) ||
                        a.ActionType.Contains("lead_grouped", StringComparison.OrdinalIgnoreCase));

                    if (leadAction != null && int.TryParse(leadAction.Value, out var leads))
                    {
                        summary.LeadsCount += leads;
                    }
                }

                if (item.CostPerActionType != null)
                {
                    var leadCplAction = item.CostPerActionType.FirstOrDefault(a =>
                        a.ActionType.Equals("lead", StringComparison.OrdinalIgnoreCase) ||
                        a.ActionType.Equals("leads", StringComparison.OrdinalIgnoreCase) ||
                        a.ActionType.Contains("lead_grouped", StringComparison.OrdinalIgnoreCase));

                    if (leadCplAction != null && decimal.TryParse(leadCplAction.Value, out var cpl))
                    {
                        summary.CostPerLead = cpl;
                    }
                }
            }

            if (summary.CostPerLead == 0 && summary.LeadsCount > 0 && summary.Spend > 0)
            {
                summary.CostPerLead = Math.Round(summary.Spend / summary.LeadsCount, 2);
            }
        }

        await ComputeInternalCampaignMetricsAsync(summary);
        return summary;
    }

    private async Task ComputeInternalCampaignMetricsAsync(MetaInsightSummaryDto summary)
    {
        try
        {
            var campaign = await _context.Campaigns
                .FirstOrDefaultAsync(c => c.ExternalCampaignId == summary.CampaignId);

            if (campaign != null)
            {
                summary.CampaignName = campaign.Name;

                var convertedLeads = await _context.Leads
                    .Where(l => l.CampaignId == campaign.Id || l.CampaignName == campaign.Name)
                    .Where(l => l.Status != null && (
                        l.Status.ToLower().Contains("converted") ||
                        l.Status.ToLower().Contains("won") ||
                        l.Status.ToLower().Contains("payment")))
                    .ToListAsync();

                var revenue = (decimal)convertedLeads
                    .Where(l => l.ProposalAmount.HasValue && l.ProposalAmount.Value > 0)
                    .Sum(l => l.ProposalAmount!.Value);

                summary.InternalRevenue = revenue;
                summary.InternalConversions = convertedLeads.Count;
                summary.InternalNetProfit = revenue - summary.Spend;
                summary.InternalRoas = summary.Spend > 0 ? Math.Round(revenue / summary.Spend, 2) : 0m;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to compute internal metrics for campaign {CampaignId}", summary.CampaignId);
        }
    }

    #endregion

    #region PART B — Lead Ads / Lead Capture

    /// <summary>
    /// PART B - 5: POST /{page_id}/leadgen_forms
    /// Must be called with a PAGE Access Token.
    /// </summary>
    public async Task<MetaIdResponse> CreateLeadFormAsync(CreateMetaLeadFormDto dto, string? pageToken = null, string? pageId = null)
    {
        var targetPageId = GetEffectivePageId(pageId ?? dto.PageId);
        if (string.IsNullOrWhiteSpace(targetPageId))
        {
            throw new ArgumentException("Page ID is required to create a lead generation form.");
        }

        var url = BuildUrl($"{targetPageId}/leadgen_forms");

        var questionsList = (dto.Questions ?? new List<string> { "FULL_NAME", "EMAIL", "PHONE" })
            .Select(q => new MetaLeadGenQuestion { Type = q.ToUpper().Trim() })
            .ToList();

        var privacyPolicy = new MetaPrivacyPolicy
        {
            Url = dto.PrivacyPolicyUrl ?? "https://hoossh.com/privacy",
            LinkText = dto.PrivacyPolicyLinkText ?? "Privacy Policy"
        };

        return await SendWithAutoRefreshAsync<MetaIdResponse>(
            token =>
            {
                var formParams = new Dictionary<string, string>
                {
                    { "name", dto.Name },
                    { "follow_up_action_url", dto.FollowUpActionUrl ?? "https://hoossh.com" },
                    { "questions", JsonSerializer.Serialize(questionsList) },
                    { "privacy_policy", JsonSerializer.Serialize(privacyPolicy) },
                    { "access_token", token }
                };

                return new HttpRequestMessage(HttpMethod.Post, url)
                {
                    Content = new FormUrlEncodedContent(formParams)
                };
            },
            isPageToken: true,
            explicitToken: pageToken ?? dto.PageAccessToken,
            actionName: "CreateLeadForm");
    }

    /// <summary>
    /// PART B - 6: GET /{page_id}/leadgen_forms
    /// </summary>
    public async Task<List<MetaLeadFormItem>> ListLeadFormsAsync(string? pageToken = null, string? pageId = null)
    {
        var targetPageId = GetEffectivePageId(pageId);
        if (string.IsNullOrWhiteSpace(targetPageId))
        {
            throw new ArgumentException("Page ID is required to list lead generation forms.");
        }

        var result = await SendWithAutoRefreshAsync<MetaLeadFormListResponse>(
            token =>
            {
                var url = BuildUrl($"{targetPageId}/leadgen_forms?access_token={Uri.EscapeDataString(token)}");
                return new HttpRequestMessage(HttpMethod.Get, url);
            },
            isPageToken: true,
            explicitToken: pageToken,
            actionName: "ListLeadForms");

        return result?.Data ?? new List<MetaLeadFormItem>();
    }

    /// <summary>
    /// PART B - 7: GET /{form_id}/leads
    /// </summary>
    public async Task<List<MetaLeadItem>> GetLeadsForFormAsync(string formId, string? pageToken = null)
    {
        if (string.IsNullOrWhiteSpace(formId))
        {
            throw new ArgumentException("Form ID is required to fetch leads.");
        }

        var fields = "id,created_time,field_data,platform,ad_id,ad_name,adset_id,adset_name,campaign_id,campaign_name,is_organic";

        var result = await SendWithAutoRefreshAsync<MetaLeadsResponse>(
            token =>
            {
                var url = BuildUrl($"{formId}/leads?fields={fields}&access_token={Uri.EscapeDataString(token)}");
                return new HttpRequestMessage(HttpMethod.Get, url);
            },
            isPageToken: true,
            explicitToken: pageToken,
            actionName: "GetLeadsForForm");

        return result?.Data ?? new List<MetaLeadItem>();
    }

    /// <summary>
    /// Helper: GET /{business_manager_id}/owned_pages?fields=name,access_token
    /// </summary>
    public async Task<string?> GetPageAccessTokenFromBusinessAsync(string businessManagerId, string pageId, string? userToken = null)
    {
        var bmId = !string.IsNullOrWhiteSpace(businessManagerId) ? businessManagerId : _options.BusinessManagerId;
        if (string.IsNullOrWhiteSpace(bmId))
        {
            _logger.LogWarning("Business Manager ID not provided. Unable to query owned_pages.");
            return null;
        }

        var result = await SendWithAutoRefreshAsync<MetaOwnedPagesResponse>(
            token =>
            {
                var url = BuildUrl($"{bmId}/owned_pages?fields=name,access_token&access_token={Uri.EscapeDataString(token)}");
                return new HttpRequestMessage(HttpMethod.Get, url);
            },
            isPageToken: false,
            explicitToken: userToken,
            actionName: "GetOwnedPages");

        if (result?.Data != null)
        {
            var targetPage = result.Data.FirstOrDefault(p => p.Id == pageId);
            if (targetPage != null && !string.IsNullOrWhiteSpace(targetPage.AccessToken))
            {
                return targetPage.AccessToken;
            }
        }

        return null;
    }

    #endregion

    #region Synchronization & Polling Background Logic

    /// <summary>
    /// Full Sync orchestration:
    /// 1. Fetches campaigns from Meta and upserts into `campaigns`
    /// 2. Fetches insights for each campaign and upserts into `ad_metrics`
    /// 3. Fetches lead forms and leads for each form, upserting into `leads`
    /// </summary>
    public async Task<MetaSyncResultDto> SyncWorkspaceMetaAsync(
        long workspaceId,
        string? userToken = null,
        string? pageToken = null,
        string? adAccountId = null,
        string? pageId = null)
    {
        var result = new MetaSyncResultDto { SyncedAt = DateTime.UtcNow };
        var uToken = await GetEffectiveUserTokenAsync(userToken);
        var pToken = await GetEffectivePageTokenAsync(pageToken);
        var account = GetEffectiveAdAccountId(adAccountId);
        var targetPage = GetEffectivePageId(pageId);

        if (string.IsNullOrWhiteSpace(uToken) && string.IsNullOrWhiteSpace(pToken))
        {
            result.Success = false;
            result.Message = "Meta integration tokens are not configured in store or appsettings.json.";
            _logger.LogInformation("Skipping Meta sync for workspace {WorkspaceId}: No tokens configured.", workspaceId);
            return result;
        }

        // 1. Sync Campaigns & Insights (via User Token)
        if (!string.IsNullOrWhiteSpace(uToken) && !string.IsNullOrWhiteSpace(account))
        {
            try
            {
                var metaCampaigns = await ListCampaignsAsync(userToken, account);
                result.CampaignsSynced = metaCampaigns.Count;

                foreach (var mc in metaCampaigns)
                {
                    var dbCampaign = await _context.Campaigns
                        .FirstOrDefaultAsync(c => c.WorkspaceId == workspaceId && c.ExternalCampaignId == mc.Id);

                    if (dbCampaign == null)
                    {
                        dbCampaign = await _context.Campaigns
                            .FirstOrDefaultAsync(c => c.WorkspaceId == workspaceId && c.Name == mc.Name && c.Platform.ToLower() == "meta");
                    }

                    if (dbCampaign == null)
                    {
                        dbCampaign = new Campaign
                        {
                            WorkspaceId = workspaceId,
                            Name = mc.Name,
                            Platform = "Meta",
                            ExternalCampaignId = mc.Id,
                            AdAccountId = account,
                            Objective = mc.Objective,
                            Status = mc.Status ?? "ACTIVE",
                            CreatedAt = DateTime.UtcNow
                        };
                        _context.Campaigns.Add(dbCampaign);
                    }
                    else
                    {
                        dbCampaign.ExternalCampaignId = mc.Id;
                        dbCampaign.AdAccountId = account;
                        dbCampaign.Objective = mc.Objective ?? dbCampaign.Objective;
                        dbCampaign.Status = mc.Status ?? dbCampaign.Status;
                    }

                    if (decimal.TryParse(mc.DailyBudget, out var dailyBudget))
                    {
                        dbCampaign.Budget = dailyBudget / 100m;
                    }

                    await _context.SaveChangesAsync();

                    // 2. Fetch insights for this campaign (daily trend for last 30 days)
                    try
                    {
                        var insights = await GetCampaignInsightsAsync(mc.Id, userToken, dailyTrend: true, datePreset: "last_30d");
                        
                        dbCampaign.Impressions = Math.Max(dbCampaign.Impressions, insights.Impressions);
                        dbCampaign.Clicks = Math.Max(dbCampaign.Clicks, insights.Clicks);
                        dbCampaign.Spend = Math.Max(dbCampaign.Spend, insights.Spend);
                        dbCampaign.LeadsCount = Math.Max(dbCampaign.LeadsCount, insights.LeadsCount);
                        await _context.SaveChangesAsync();

                        foreach (var daily in insights.DailyBreakdown)
                        {
                            if (!DateOnly.TryParse(daily.DateStart, out var metricDate))
                            {
                                metricDate = DateOnly.FromDateTime(DateTime.UtcNow);
                            }

                            var dbMetric = await _context.AdMetrics
                                .FirstOrDefaultAsync(m => m.WorkspaceId == workspaceId && m.CampaignId == dbCampaign.Id && m.Date == metricDate);

                            if (dbMetric == null)
                            {
                                dbMetric = new AdMetrics
                                {
                                    WorkspaceId = workspaceId,
                                    CampaignId = dbCampaign.Id,
                                    Platform = "Meta",
                                    Date = metricDate
                                };
                                _context.AdMetrics.Add(dbMetric);
                            }

                            if (int.TryParse(daily.Impressions, out var imp)) dbMetric.Impressions = imp;
                            if (int.TryParse(daily.Clicks, out var clk)) dbMetric.Clicks = clk;
                            if (decimal.TryParse(daily.Spend, out var sp)) dbMetric.Spend = sp;
                            if (int.TryParse(daily.Reach, out var rch)) dbMetric.Reach = rch;
                            if (decimal.TryParse(daily.Frequency, out var freq)) dbMetric.Frequency = freq;
                            if (decimal.TryParse(daily.Cpc, out var cpc)) dbMetric.Cpc = cpc;
                            if (decimal.TryParse(daily.Cpm, out var cpm)) dbMetric.Cpm = cpm;
                            if (decimal.TryParse(daily.Ctr, out var ctr)) dbMetric.Ctr = ctr;

                            if (daily.Actions != null)
                            {
                                var leadAction = daily.Actions.FirstOrDefault(a => a.ActionType.Contains("lead", StringComparison.OrdinalIgnoreCase));
                                if (leadAction != null && int.TryParse(leadAction.Value, out var lCount))
                                {
                                    dbMetric.LeadsCount = lCount;
                                }
                            }

                            result.InsightsSynced++;
                        }

                        await _context.SaveChangesAsync();
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to sync insights for campaign {CampaignId}", mc.Id);
                        result.Errors.Add($"Insights sync failed for campaign {mc.Name}: {ex.Message}");
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to sync Meta campaigns for workspace {WorkspaceId}", workspaceId);
                result.Errors.Add($"Campaign sync failed: {ex.Message}");
            }
        }

        // 3. Sync Lead Forms & Leads (via Page Token)
        if (!string.IsNullOrWhiteSpace(pToken) && !string.IsNullOrWhiteSpace(targetPage))
        {
            try
            {
                var forms = await ListLeadFormsAsync(pageToken, targetPage);
                result.FormsSynced = forms.Count;

                foreach (var form in forms)
                {
                    try
                    {
                        var rawLeads = await GetLeadsForFormAsync(form.Id, pageToken);
                        result.LeadsSynced += rawLeads.Count;

                        foreach (var metaLead in rawLeads)
                        {
                            var existingLead = await _context.Leads
                                .FirstOrDefaultAsync(l => l.WorkspaceId == workspaceId && l.ExternalLeadId == metaLead.Id);

                            if (existingLead == null)
                            {
                                var newLead = MapMetaLeadToEntity(metaLead, workspaceId, form.Id);
                                _context.Leads.Add(newLead);
                                result.NewLeadsCreated++;
                            }
                            else
                            {
                                UpdateExistingLead(existingLead, metaLead, form.Id);
                            }
                        }

                        await _context.SaveChangesAsync();
                    }
                    catch (Exception ex)
                    {
                        var detailedError = ex.InnerException?.Message ?? ex.Message;
                        _logger.LogError(ex, "Failed to sync leads for form {FormId}: {Error}", form.Id, detailedError);
                        result.Errors.Add($"Leads sync failed for form {form.Name} ({form.Id}): {detailedError}");
                    }
                }
            }
            catch (Exception ex)
            {
                var detailedError = ex.InnerException?.Message ?? ex.Message;
                _logger.LogError(ex, "Failed to sync lead forms for workspace {WorkspaceId}: {Error}", workspaceId, detailedError);
                result.Errors.Add($"Forms sync failed: {detailedError}");
            }
        }

        result.Success = result.Errors.Count == 0;
        result.Message = result.Success 
            ? $"Meta sync completed successfully. Synced {result.CampaignsSynced} campaigns, {result.FormsSynced} forms, and created {result.NewLeadsCreated} new leads."
            : $"Meta sync finished with {result.Errors.Count} error(s). Synced {result.CampaignsSynced} campaigns, {result.FormsSynced} forms, {result.NewLeadsCreated} new leads.";

        return result;
    }

    private static string? SafeTruncate(string? val, int maxLen)
    {
        if (string.IsNullOrEmpty(val)) return val;
        return val.Length > maxLen ? val.Substring(0, maxLen) : val;
    }

    private Lead MapMetaLeadToEntity(MetaLeadItem metaLead, long workspaceId, string formId)
    {
        var lead = new Lead
        {
            WorkspaceId = workspaceId,
            ExternalLeadId = SafeTruncate(metaLead.Id, 64),
            FormId = SafeTruncate(formId, 64),
            AdId = SafeTruncate(metaLead.AdId, 64),
            AdName = SafeTruncate(metaLead.AdName, 100),
            AdsetId = SafeTruncate(metaLead.AdsetId, 64),
            AdsetName = SafeTruncate(metaLead.AdsetName, 100),
            CampaignName = SafeTruncate(metaLead.CampaignName, 100),
            SourcePlatform = !string.IsNullOrWhiteSpace(metaLead.Platform) ? SafeTruncate(metaLead.Platform.ToUpper(), 50) : "META",
            IsOrganic = metaLead.IsOrganic ?? false,
            Status = "NEW",
            Priority = "MEDIUM",
            CreatedAt = DateTime.TryParse(metaLead.CreatedTime, out var dt) ? dt.ToUniversalTime() : DateTime.UtcNow
        };

        if (!string.IsNullOrWhiteSpace(metaLead.CampaignId))
        {
            var dbCamp = _context.Campaigns.FirstOrDefault(c => c.WorkspaceId == workspaceId && c.ExternalCampaignId == metaLead.CampaignId);
            if (dbCamp != null)
            {
                lead.CampaignId = dbCamp.Id;
            }
        }

        ExtractLeadFieldData(lead, metaLead.FieldData);
        return lead;
    }

    private void UpdateExistingLead(Lead lead, MetaLeadItem metaLead, string formId)
    {
        lead.FormId = SafeTruncate(formId, 64);
        lead.AdId = SafeTruncate(metaLead.AdId ?? lead.AdId, 64);
        lead.AdName = SafeTruncate(metaLead.AdName ?? lead.AdName, 100);
        lead.AdsetId = SafeTruncate(metaLead.AdsetId ?? lead.AdsetId, 64);
        lead.AdsetName = SafeTruncate(metaLead.AdsetName ?? lead.AdsetName, 100);
        lead.CampaignName = SafeTruncate(metaLead.CampaignName ?? lead.CampaignName, 100);
        lead.IsOrganic = metaLead.IsOrganic ?? lead.IsOrganic;

        if (metaLead.FieldData != null && metaLead.FieldData.Count > 0)
        {
            lead.RawFormData = JsonSerializer.Serialize(metaLead.FieldData);
        }
    }

    private void ExtractLeadFieldData(Lead lead, List<MetaFieldDataItem>? fieldData)
    {
        if (fieldData == null || fieldData.Count == 0) return;

        lead.RawFormData = JsonSerializer.Serialize(fieldData);

        string? fullName = null;
        string? firstName = null;
        string? lastName = null;
        string? email = null;
        string? phone = null;
        string? company = null;
        string? city = null;

        foreach (var field in fieldData)
        {
            var val = field.Values?.FirstOrDefault()?.Trim() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(val)) continue;

            var fieldName = field.Name.ToLowerInvariant();

            if (fieldName == "full_name" || fieldName == "name")
            {
                fullName = val;
            }
            else if (fieldName == "first_name")
            {
                firstName = val;
            }
            else if (fieldName == "last_name")
            {
                lastName = val;
            }
            else if (fieldName == "email")
            {
                email = val;
            }
            else if (fieldName == "phone_number" || fieldName == "phone")
            {
                phone = val;
            }
            else if (fieldName == "company_name" || fieldName == "company")
            {
                company = val;
            }
            else if (fieldName == "city" || fieldName == "location")
            {
                city = val;
            }
        }

        lead.Name = SafeTruncate(!string.IsNullOrWhiteSpace(fullName)
            ? fullName
            : $"{firstName} {lastName}".Trim(), 100) ?? $"Lead #{lead.ExternalLeadId}";

        if (string.IsNullOrWhiteSpace(lead.Name))
        {
            lead.Name = $"Lead #{lead.ExternalLeadId}";
        }

        lead.Email = SafeTruncate(!string.IsNullOrWhiteSpace(email) ? email : $"lead_{lead.ExternalLeadId}@meta.leadgen", 100)!;
        lead.Phone = SafeTruncate(phone, 20);
        lead.Company = SafeTruncate(company, 100);
        lead.Location = SafeTruncate(city, 100);
    }

    #endregion

    #region Status & Token Health Verification

    public async Task<MetaIntegrationStatusDto> GetStatusAsync(
        string? userToken = null,
        string? pageToken = null,
        string? adAccountId = null,
        string? pageId = null)
    {
        var uToken = await GetEffectiveUserTokenAsync(userToken);
        var pToken = await GetEffectivePageTokenAsync(pageToken);
        var account = GetEffectiveAdAccountId(adAccountId);
        var targetPage = GetEffectivePageId(pageId);

        var status = new MetaIntegrationStatusDto
        {
            AdAccountId = account,
            PageId = targetPage,
            ApiVersion = _options.ApiVersion,
            HasUserToken = !string.IsNullOrWhiteSpace(uToken),
            HasPageToken = !string.IsNullOrWhiteSpace(pToken),
            IsConfigured = !string.IsNullOrWhiteSpace(account) && !string.IsNullOrWhiteSpace(targetPage)
        };

        // Test User Token
        if (status.HasUserToken)
        {
            try
            {
                await ListCampaignsAsync(uToken, account);
                status.IsUserTokenValid = true;
            }
            catch (Exception ex)
            {
                status.IsUserTokenValid = false;
                status.TokenValidationMessage = $"User token validation failed: {ex.Message}";
            }
        }

        // Test Page Token
        if (status.HasPageToken)
        {
            try
            {
                await ListLeadFormsAsync(pToken, targetPage);
                status.IsPageTokenValid = true;
            }
            catch (Exception ex)
            {
                status.IsPageTokenValid = false;
                status.TokenValidationMessage = string.IsNullOrWhiteSpace(status.TokenValidationMessage)
                    ? $"Page token validation failed: {ex.Message}"
                    : $"{status.TokenValidationMessage}; Page token validation failed: {ex.Message}";
            }
        }

        return status;
    }

    #endregion

    #region Helpers, Reactive Error 190 Auto-Refresh & Deserialization

    private static void ValidateToken(string token, string tokenType)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            throw new InvalidOperationException($"{tokenType} is missing. Please configure it in appsettings.json or provide a token in the request.");
        }
    }

    /// <summary>
    /// Executes an HTTP request with automatic reactive Error 190 detection, long-lived token re-exchange, and single-retry capability.
    /// </summary>
    private async Task<T> SendWithAutoRefreshAsync<T>(
        Func<string, HttpRequestMessage> requestFactory,
        bool isPageToken,
        string? explicitToken,
        string actionName)
    {
        var initialToken = isPageToken
            ? await GetEffectivePageTokenAsync(explicitToken)
            : await GetEffectiveUserTokenAsync(explicitToken);

        ValidateToken(initialToken, isPageToken ? "Page Access Token" : "User Access Token");

        using var initialRequest = requestFactory(initialToken);
        var response = await _httpClient.SendAsync(initialRequest);
        var content = await response.Content.ReadAsStringAsync();

        if (response.IsSuccessStatusCode)
        {
            return DeserializeResponse<T>(content, actionName);
        }

        // Check for error details
        MetaErrorResponse? errorObj = null;
        try
        {
            errorObj = JsonSerializer.Deserialize<MetaErrorResponse>(content, _jsonOptions);
        }
        catch
        {
            // Non-JSON payload
        }

        var errorCode = errorObj?.Error?.Code ?? 0;
        var errorSubcode = errorObj?.Error?.ErrorSubcode;
        var errorMessage = errorObj?.Error?.Message ?? content;

        // Reactive Refresh on Error 190 (Token Expired / Session Invalid)
        if (errorCode == 190 && string.IsNullOrWhiteSpace(explicitToken))
        {
            _logger.LogWarning(
                "Meta Graph API Token Expired (Error 190) during {Action}: {Message}. Attempting reactive token re-exchange...",
                actionName, errorMessage);

            try
            {
                string? refreshedUserToken = null;

                // Priority 1: If appsettings.json has a UserAccessToken that is different from the failed initialToken, try it
                var configUserToken = _options.UserAccessToken?.Trim();
                if (!string.IsNullOrWhiteSpace(configUserToken) && configUserToken != initialToken)
                {
                    _logger.LogInformation("Attempting token exchange with fresh config token from appsettings.json...");
                    try
                    {
                        refreshedUserToken = await ExchangeForLongLivedTokenAsync(configUserToken);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to exchange config UserAccessToken.");
                    }
                }

                // Priority 2: Attempt exchange using stored User token
                if (string.IsNullOrWhiteSpace(refreshedUserToken))
                {
                    var storedUserToken = (await _context.MetaTokens.AsNoTracking().FirstOrDefaultAsync(t => t.TokenType == "User"))?.AccessToken;
                    if (!string.IsNullOrWhiteSpace(storedUserToken) && storedUserToken != initialToken)
                    {
                        try
                        {
                            refreshedUserToken = await ExchangeForLongLivedTokenAsync(storedUserToken);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning(ex, "Failed to exchange stored DB User token.");
                        }
                    }
                }

                // Priority 3: Attempt re-exchanging initialToken if it is still exchangeable
                if (string.IsNullOrWhiteSpace(refreshedUserToken) && !string.IsNullOrWhiteSpace(initialToken))
                {
                    try
                    {
                        refreshedUserToken = await ExchangeForLongLivedTokenAsync(initialToken);
                    }
                    catch { }
                }

                if (!string.IsNullOrWhiteSpace(refreshedUserToken))
                {
                    string retryToken;
                    if (isPageToken)
                    {
                        var refreshedPageToken = await RefreshPageAccessTokenAsync(refreshedUserToken);
                        retryToken = refreshedPageToken ?? await GetEffectivePageTokenAsync();
                    }
                    else
                    {
                        retryToken = refreshedUserToken;
                    }

                    ValidateToken(retryToken, isPageToken ? "Page Access Token" : "User Access Token");

                    _logger.LogInformation("Reactive token refresh succeeded. Retrying {Action} request...", actionName);
                    using var retryRequest = requestFactory(retryToken);
                    var retryResponse = await _httpClient.SendAsync(retryRequest);
                    var retryContent = await retryResponse.Content.ReadAsStringAsync();

                    if (retryResponse.IsSuccessStatusCode)
                    {
                        _logger.LogInformation("Retried request for {Action} succeeded after reactive token refresh.", actionName);
                        return DeserializeResponse<T>(retryContent, actionName);
                    }

                    _logger.LogError("Retried request for {Action} failed with status {StatusCode}: {Content}",
                        actionName, retryResponse.StatusCode, retryContent);
                }
                else
                {
                    // If all exchange attempts failed, clear the stale expired tokens from DB
                    _logger.LogWarning("Clearing invalid expired tokens from meta_tokens table.");
                    await ClearTokensAsync();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Reactive token refresh attempt failed for {Action}.", actionName);
            }

            _logger.LogError(
                "Meta Graph API token expired (Error #190) and automatic re-exchange could not restore access for {Action}. " +
                "Action required: Generate a fresh short-lived User token from Meta Graph API Explorer, paste into appsettings.json, and call POST /api/meta/reseed-tokens.",
                actionName);

            throw new InvalidOperationException(
                $"Meta Graph API token expired (Error #190): {errorMessage}. " +
                "Stale tokens cleared from store. Please provide a fresh User Access Token in appsettings.json or call POST /api/meta/exchange-token.");
        }

        _logger.LogError("Meta Graph API error during {Action}: Code {Code}, Subcode {Subcode}, Message: {Message}",
            actionName, errorCode, errorSubcode, errorMessage);

        throw new HttpRequestException($"Meta Graph API error ({response.StatusCode}): {errorMessage}");
    }

    private T DeserializeResponse<T>(string content, string actionName)
    {
        try
        {
            var deserialized = JsonSerializer.Deserialize<T>(content, _jsonOptions);
            return deserialized!;
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "Failed to deserialize Meta Graph API response for {Action}. Raw content: {Content}", actionName, content);
            throw new InvalidOperationException($"Failed to deserialize response from Meta Graph API: {ex.Message}", ex);
        }
    }

    #endregion
}
