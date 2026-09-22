using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using LeadGrowth.Data;
using LeadGrowth.DTOs;
using LeadGrowth.Hubs;
using LeadGrowth.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace LeadGrowth.Services;

public class GoogleAdsService : IGoogleAdsService
{
    private readonly HttpClient _googleAdsHttpClient;
    private readonly HttpClient _authHttpClient;
    private readonly IOptionsMonitor<GoogleAdsOptions> _optionsMonitor;
    private readonly LeadGrowthDbContext _context;
    private readonly IHubContext<LeadHub> _hubContext;
    private readonly ILogger<GoogleAdsService> _logger;

    private GoogleAdsOptions _options => _optionsMonitor.CurrentValue;

    private static readonly SemaphoreSlim _tokenLock = new(1, 1);
    private static string? _cachedAccessToken;
    private static DateTime _accessTokenExpiresAtUtc = DateTime.MinValue;
    private static DateTime? _lastRefreshedAtUtc;

    private readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public GoogleAdsService(
        IHttpClientFactory httpClientFactory,
        IOptionsMonitor<GoogleAdsOptions> optionsMonitor,
        LeadGrowthDbContext context,
        IHubContext<LeadHub> hubContext,
        ILogger<GoogleAdsService> logger)
    {
        _googleAdsHttpClient = httpClientFactory.CreateClient("GoogleAdsApi");
        _authHttpClient = httpClientFactory.CreateClient("GoogleOAuth");
        _optionsMonitor = optionsMonitor;
        _context = context;
        _hubContext = hubContext;
        _logger = logger;
    }

    #region Auth & Token Lifecycle Management

    /// <summary>
    /// Refreshes the OAuth access token using the long-lived refresh token.
    /// Caches the token in-memory and refreshes when within 5 minutes of expiry.
    /// </summary>
    public async Task<string> RefreshAccessTokenAsync(bool forceRefresh = false)
    {
        if (!forceRefresh && !string.IsNullOrWhiteSpace(_cachedAccessToken) && DateTime.UtcNow < _accessTokenExpiresAtUtc.AddMinutes(-5))
        {
            return _cachedAccessToken;
        }

        await _tokenLock.WaitAsync();
        try
        {
            if (!forceRefresh && !string.IsNullOrWhiteSpace(_cachedAccessToken) && DateTime.UtcNow < _accessTokenExpiresAtUtc.AddMinutes(-5))
            {
                return _cachedAccessToken;
            }

            if (string.IsNullOrWhiteSpace(_options.ClientId) || string.IsNullOrWhiteSpace(_options.ClientSecret) || string.IsNullOrWhiteSpace(_options.RefreshToken))
            {
                throw new InvalidOperationException("Google Ads OAuth credentials (ClientId, ClientSecret, RefreshToken) are not configured in appsettings.json.");
            }

            _logger.LogInformation("Refreshing Google Ads access token via OAuth token endpoint...");

            var formFields = new Dictionary<string, string>
            {
                { "client_id", _options.ClientId.Trim() },
                { "client_secret", _options.ClientSecret.Trim() },
                { "refresh_token", _options.RefreshToken.Trim() },
                { "grant_type", "refresh_token" }
            };

            var tokenUrl = string.IsNullOrWhiteSpace(_options.TokenUrl) ? "https://oauth2.googleapis.com/token" : _options.TokenUrl;
            var response = await _authHttpClient.PostAsync(tokenUrl, new FormUrlEncodedContent(formFields));

            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync();
                _logger.LogError("Failed to refresh Google Ads OAuth token. HTTP {StatusCode}: {ErrorBody}", response.StatusCode, errorBody);
                throw new HttpRequestException($"Failed to refresh Google Ads OAuth access token: HTTP {response.StatusCode} - {errorBody}");
            }

            var tokenResult = await response.Content.ReadFromJsonAsync<GoogleOAuthTokenResponse>(_jsonOptions);
            if (tokenResult == null || string.IsNullOrWhiteSpace(tokenResult.AccessToken))
            {
                throw new InvalidOperationException("Received empty access token from Google OAuth endpoint.");
            }

            _cachedAccessToken = tokenResult.AccessToken;
            _accessTokenExpiresAtUtc = DateTime.UtcNow.AddSeconds(tokenResult.ExpiresIn > 60 ? tokenResult.ExpiresIn : 3600);
            _lastRefreshedAtUtc = DateTime.UtcNow;

            _logger.LogInformation("Google Ads access token refreshed successfully. Expires at (UTC): {ExpiresAt}", _accessTokenExpiresAtUtc);
            return _cachedAccessToken;
        }
        finally
        {
            _tokenLock.Release();
        }
    }

    #endregion

    #region Google Ads GAQL Query Execution

    /// <summary>
    /// Executes a Google Ads Query Language (GAQL) query via the googleAds:search endpoint.
    /// Handles 401 UNAUTHENTICATED errors by refreshing the access token and retrying once.
    /// </summary>
    private async Task<GoogleAdsSearchResponse> ExecuteGaqlAsync(string customerId, string query, bool isRetry = false)
    {
        var cleanCustomerId = GoogleAdsOptions.FormatCustomerId(customerId);
        if (string.IsNullOrWhiteSpace(cleanCustomerId))
        {
            cleanCustomerId = GoogleAdsOptions.FormatCustomerId(_options.CustomerId);
        }

        if (string.IsNullOrWhiteSpace(cleanCustomerId))
        {
            throw new InvalidOperationException("Google Ads Customer ID is required.");
        }

        var accessToken = await RefreshAccessTokenAsync(forceRefresh: isRetry);
        var baseUrl = string.IsNullOrWhiteSpace(_options.BaseUrl) ? "https://googleads.googleapis.com" : _options.BaseUrl.TrimEnd('/');
        var apiVersion = string.IsNullOrWhiteSpace(_options.ApiVersion) ? "v19" : _options.ApiVersion;
        var requestUrl = $"{baseUrl}/{apiVersion}/customers/{cleanCustomerId}/googleAds:search";

        using var request = new HttpRequestMessage(HttpMethod.Post, requestUrl)
        {
            Content = JsonContent.Create(new GoogleAdsSearchRequest { Query = query })
        };

        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        // Developer Token is ignored by Google as of Sept 9, 2026, but included as a placeholder header if specified
        var devToken = string.IsNullOrWhiteSpace(_options.DeveloperToken) ? "ignored" : _options.DeveloperToken;
        request.Headers.Add("developer-token", devToken);

        // Login Customer ID (Manager/MCC account ID header)
        var loginCustomerId = GoogleAdsOptions.FormatCustomerId(_options.LoginCustomerId);
        if (!string.IsNullOrWhiteSpace(loginCustomerId))
        {
            request.Headers.Add("login-customer-id", loginCustomerId);
        }

        var response = await _googleAdsHttpClient.SendAsync(request);

        if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized && !isRetry)
        {
            _logger.LogWarning("Received 401 Unauthorized from Google Ads API. Forcing access token refresh and retrying once...");
            return await ExecuteGaqlAsync(cleanCustomerId, query, isRetry: true);
        }

        if (!response.IsSuccessStatusCode)
        {
            var errorBody = await response.Content.ReadAsStringAsync();
            _logger.LogError("Google Ads API request failed. HTTP {StatusCode} on customer {CustomerId}: {ErrorBody}", response.StatusCode, cleanCustomerId, errorBody);

            try
            {
                var errorObj = JsonSerializer.Deserialize<GoogleAdsErrorResponse>(errorBody, _jsonOptions);
                if (errorObj?.Error != null)
                {
                    throw new HttpRequestException($"Google Ads API Error ({errorObj.Error.Code} {errorObj.Error.Status}): {errorObj.Error.Message}");
                }
            }
            catch (JsonException) { }

            throw new HttpRequestException($"Google Ads API error: HTTP {response.StatusCode} - {errorBody}");
        }

        var searchResponse = await response.Content.ReadFromJsonAsync<GoogleAdsSearchResponse>(_jsonOptions);
        return searchResponse ?? new GoogleAdsSearchResponse();
    }

    #endregion

    #region Campaign Management & Listing

    /// <summary>
    /// Lists all campaigns for the specified Google Ads customer account.
    /// </summary>
    public async Task<List<GoogleCampaignDto>> ListCampaignsAsync(string? customerId = null)
    {
        var effectiveCustomerId = GoogleAdsOptions.FormatCustomerId(!string.IsNullOrWhiteSpace(customerId) ? customerId : _options.CustomerId);
        _logger.LogInformation("Listing Google Ads campaigns for customer: {CustomerId}", effectiveCustomerId);

        const string gaql = @"
            SELECT 
                campaign.id, 
                campaign.name, 
                campaign.status, 
                campaign.advertising_channel_type, 
                campaign_budget.amount_micros,
                campaign.start_date,
                campaign.end_date
            FROM campaign 
            ORDER BY campaign.id DESC";

        var searchResponse = await ExecuteGaqlAsync(effectiveCustomerId, gaql);
        var campaignDtos = new List<GoogleCampaignDto>();

        foreach (var row in searchResponse.Results)
        {
            if (row.Campaign == null) continue;

            var budgetMicros = ParseLong(row.CampaignBudget?.AmountMicros);
            var budgetDecimal = budgetMicros / 1_000_000m;

            campaignDtos.Add(new GoogleCampaignDto
            {
                Id = row.Campaign.Id,
                Name = row.Campaign.Name ?? $"Google Campaign {row.Campaign.Id}",
                Status = MapGoogleCampaignStatus(row.Campaign.Status),
                ChannelType = row.Campaign.AdvertisingChannelType,
                Budget = budgetDecimal,
                CreatedAt = ParseGoogleDate(row.Campaign.StartDate)
            });
        }

        return campaignDtos;
    }

    #endregion

    #region Campaign Metrics & Performance Insights

    /// <summary>
    /// Retrieves aggregated campaign performance metrics and daily breakdowns using GAQL.
    /// </summary>
    public async Task<GoogleCampaignMetricsSummaryDto> GetCampaignMetricsAsync(
        string? customerId = null,
        string? campaignId = null,
        string? dateRange = "LAST_30_DAYS")
    {
        var effectiveCustomerId = GoogleAdsOptions.FormatCustomerId(!string.IsNullOrWhiteSpace(customerId) ? customerId : _options.CustomerId);
        _logger.LogInformation("Fetching Google Ads metrics for customer: {CustomerId}, campaignId: {CampaignId}", effectiveCustomerId, campaignId);

        var rangeClause = string.IsNullOrWhiteSpace(dateRange) ? "LAST_30_DAYS" : dateRange.Trim();
        var gaql = $@"
            SELECT 
                campaign.id, 
                campaign.name, 
                metrics.impressions, 
                metrics.clicks, 
                metrics.cost_micros, 
                metrics.ctr, 
                metrics.average_cpc, 
                metrics.average_cpm,
                metrics.conversions, 
                metrics.conversions_value,
                segments.date 
            FROM campaign 
            WHERE segments.date DURING {rangeClause}";

        if (!string.IsNullOrWhiteSpace(campaignId))
        {
            gaql += $" AND campaign.id = '{campaignId.Trim()}'";
        }

        gaql += " ORDER BY segments.date DESC";

        var searchResponse = await ExecuteGaqlAsync(effectiveCustomerId, gaql);

        var summary = new GoogleCampaignMetricsSummaryDto
        {
            CustomerId = effectiveCustomerId,
            CampaignId = campaignId
        };

        long totalImpressions = 0;
        long totalClicks = 0;
        decimal totalSpend = 0;
        double totalConversions = 0;
        var dailyMap = new Dictionary<string, GoogleDailyMetricItemDto>();

        foreach (var row in searchResponse.Results)
        {
            if (row.Metrics == null) continue;

            if (string.IsNullOrEmpty(summary.CampaignName) && row.Campaign != null)
            {
                summary.CampaignName = row.Campaign.Name;
            }

            var impressions = ParseLong(row.Metrics.Impressions);
            var clicks = ParseLong(row.Metrics.Clicks);
            var costMicros = ParseLong(row.Metrics.CostMicros);
            var spend = costMicros / 1_000_000m;
            var conversions = (int)(row.Metrics.Conversions ?? 0);
            var avgCpc = (row.Metrics.AverageCpc ?? 0) / 1_000_000.0;
            var ctr = (decimal)((row.Metrics.Ctr ?? 0) * 100.0);

            totalImpressions += impressions;
            totalClicks += clicks;
            totalSpend += spend;
            totalConversions += conversions;

            var dateKey = row.Segments?.Date ?? DateTime.UtcNow.ToString("yyyy-MM-dd");
            if (!dailyMap.TryGetValue(dateKey, out var dailyItem))
            {
                dailyItem = new GoogleDailyMetricItemDto
                {
                    Date = dateKey,
                    Impressions = (int)impressions,
                    Clicks = (int)clicks,
                    Spend = spend,
                    AverageCpc = (decimal)avgCpc,
                    Ctr = ctr,
                    Conversions = conversions
                };
                dailyMap[dateKey] = dailyItem;
            }
            else
            {
                dailyItem.Impressions += (int)impressions;
                dailyItem.Clicks += (int)clicks;
                dailyItem.Spend += spend;
                dailyItem.Conversions += conversions;
            }
        }

        summary.Impressions = (int)totalImpressions;
        summary.Clicks = (int)totalClicks;
        summary.Spend = totalSpend;
        summary.Ctr = totalImpressions > 0 ? Math.Round((decimal)totalClicks / totalImpressions * 100m, 2) : 0m;
        summary.AverageCpc = totalClicks > 0 ? Math.Round(totalSpend / totalClicks, 2) : 0m;
        summary.AverageCpm = totalImpressions > 0 ? Math.Round((totalSpend / totalImpressions) * 1000m, 2) : 0m;
        summary.Conversions = (int)totalConversions;
        summary.CostPerConversion = summary.Conversions > 0 ? Math.Round(totalSpend / summary.Conversions, 2) : 0m;
        summary.DailyBreakdown = dailyMap.Values.OrderByDescending(d => d.Date).ToList();

        // Calculate internal workspace converted leads and revenue matching Google Ads
        try
        {
            var internalLeads = await _context.Leads
                .AsNoTracking()
                .Where(l => l.SourcePlatform != null && l.SourcePlatform.Contains("Google"))
                .ToListAsync();

            if (!string.IsNullOrWhiteSpace(campaignId))
            {
                internalLeads = internalLeads.Where(l => l.ExternalLeadId == campaignId || (l.Campaign != null && l.Campaign.ExternalCampaignId == campaignId)).ToList();
            }

            var converted = internalLeads.Where(l => IsConvertedStatus(l.Status)).ToList();
            summary.InternalConvertedLeads = converted.Count;
            summary.InternalRevenue = (decimal)converted
                .Where(l => l.ProposalAmount.HasValue && l.ProposalAmount.Value > 0)
                .Sum(l => l.ProposalAmount!.Value);

            summary.InternalRoas = summary.Spend > 0 ? Math.Round(summary.InternalRevenue / summary.Spend, 2) : 0m;
            summary.InternalNetProfit = summary.InternalRevenue - summary.Spend;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to compute internal revenue metrics for Google Ads campaign {CampaignId}", campaignId);
        }

        return summary;
    }

    #endregion

    #region Lead Form Submissions (Google Lead Ads Equivalent)

    /// <summary>
    /// Retrieves lead form submissions submitted within the Google Ads 60-day retention window.
    /// </summary>
    public async Task<List<GoogleLeadDto>> ListLeadFormSubmissionsAsync(string? customerId = null, int daysLookback = 60)
    {
        var effectiveCustomerId = GoogleAdsOptions.FormatCustomerId(!string.IsNullOrWhiteSpace(customerId) ? customerId : _options.CustomerId);
        _logger.LogInformation("Fetching Google Ads lead form submissions for customer: {CustomerId} (Lookback: {Days} days)", effectiveCustomerId, daysLookback);

        const string gaql = @"
            SELECT 
                lead_form_submission_data.id,
                lead_form_submission_data.asset,
                lead_form_submission_data.campaign,
                lead_form_submission_data.ad_group_ad,
                lead_form_submission_data.gclid,
                lead_form_submission_data.submission_date_time,
                lead_form_submission_data.lead_form_submission_fields
            FROM lead_form_submission_data";

        var leads = new List<GoogleLeadDto>();

        try
        {
            var searchResponse = await ExecuteGaqlAsync(effectiveCustomerId, gaql);

            foreach (var row in searchResponse.Results)
            {
                if (row.LeadFormSubmissionData == null) continue;

                var data = row.LeadFormSubmissionData;
                var submissionTime = ParseGoogleDateTime(data.SubmissionDateTime);

                // Enforce lookback window (Google Ads retains lead submissions for max 60 days)
                if (submissionTime < DateTime.UtcNow.AddDays(-daysLookback))
                {
                    continue;
                }

                var leadDto = new GoogleLeadDto
                {
                    SubmissionId = data.Id,
                    AssetId = ExtractResourceSuffix(data.Asset),
                    CampaignId = ExtractResourceSuffix(data.Campaign),
                    Gclid = data.Gclid,
                    SubmissionDateTime = submissionTime
                };

                string? fullName = null;
                string? firstName = null;
                string? lastName = null;
                string? email = null;
                string? phone = null;
                string? company = null;
                string? city = null;
                string? state = null;
                string? postalCode = null;

                if (data.LeadFormSubmissionFields != null)
                {
                    foreach (var field in data.LeadFormSubmissionFields)
                    {
                        if (string.IsNullOrWhiteSpace(field.FieldType)) continue;

                        leadDto.Fields[field.FieldType] = field.FieldValue;
                        var fieldTypeUpper = field.FieldType.ToUpperInvariant();

                        switch (fieldTypeUpper)
                        {
                            case "FULL_NAME":
                                fullName = field.FieldValue;
                                break;
                            case "FIRST_NAME":
                                firstName = field.FieldValue;
                                break;
                            case "LAST_NAME":
                                lastName = field.FieldValue;
                                break;
                            case "EMAIL":
                            case "WORK_EMAIL":
                                if (string.IsNullOrWhiteSpace(email)) email = field.FieldValue;
                                break;
                            case "PHONE_NUMBER":
                            case "WORK_PHONE":
                                if (string.IsNullOrWhiteSpace(phone)) phone = field.FieldValue;
                                break;
                            case "COMPANY_NAME":
                                company = field.FieldValue;
                                break;
                            case "CITY":
                                city = field.FieldValue;
                                break;
                            case "REGION":
                            case "STATE":
                                state = field.FieldValue;
                                break;
                            case "POSTAL_CODE":
                            case "ZIP_CODE":
                                postalCode = field.FieldValue;
                                break;
                        }
                    }
                }

                if (string.IsNullOrWhiteSpace(fullName) && (!string.IsNullOrWhiteSpace(firstName) || !string.IsNullOrWhiteSpace(lastName)))
                {
                    fullName = $"{firstName} {lastName}".Trim();
                }

                leadDto.Name = !string.IsNullOrWhiteSpace(fullName) ? fullName : "Google Ads Lead";
                leadDto.Email = email;
                leadDto.Phone = phone;
                leadDto.Company = company;

                var locParts = new List<string>();
                if (!string.IsNullOrWhiteSpace(city)) locParts.Add(city);
                if (!string.IsNullOrWhiteSpace(state)) locParts.Add(state);
                if (!string.IsNullOrWhiteSpace(postalCode)) locParts.Add(postalCode);
                leadDto.Location = locParts.Count > 0 ? string.Join(", ", locParts) : null;

                leads.Add(leadDto);
            }
        }
        catch (HttpRequestException ex)
        {
            _logger.LogWarning(ex, "Could not fetch lead_form_submission_data from Google Ads. Customer account may not have active Lead Form Assets.");
        }

        return leads;
    }

    #endregion

    #region Full Workspace Sync Engine

    /// <summary>
    /// Executes a full synchronization of Google Ads campaigns, daily metrics, and leads into the workspace database.
    /// </summary>
    public async Task<GoogleSyncResultDto> SyncWorkspaceGoogleAsync(long workspaceId, string? customerId = null)
    {
        var effectiveCustomerId = GoogleAdsOptions.FormatCustomerId(!string.IsNullOrWhiteSpace(customerId) ? customerId : _options.CustomerId);
        _logger.LogInformation("Starting full Google Ads synchronization for workspace {WorkspaceId} (Customer: {CustomerId})...", workspaceId, effectiveCustomerId);

        var result = new GoogleSyncResultDto();

        var workspace = await _context.Workspaces.FirstOrDefaultAsync(w => w.Id == workspaceId);
        if (workspace == null)
        {
            result.Success = false;
            result.Message = $"Workspace {workspaceId} not found.";
            result.Errors.Add(result.Message);
            return result;
        }

        // Guard: If Google Ads OAuth credentials are not configured, skip gracefully
        if (string.IsNullOrWhiteSpace(_options.ClientId) || string.IsNullOrWhiteSpace(_options.ClientSecret) || string.IsNullOrWhiteSpace(_options.RefreshToken))
        {
            _logger.LogInformation("Google Ads OAuth credentials not configured in appsettings.json. Skipping Google Ads sync for workspace {WorkspaceId}.", workspaceId);
            result.Success = true;
            result.Message = "Google Ads credentials not configured in appsettings.json. Sync skipped.";
            return result;
        }

        // 1. Sync Campaigns
        var campaignMap = new Dictionary<string, Campaign>(StringComparer.OrdinalIgnoreCase);
        try
        {
            var googleCampaigns = await ListCampaignsAsync(effectiveCustomerId);
            _logger.LogInformation("Retrieved {Count} campaigns from Google Ads API.", googleCampaigns.Count);

            foreach (var gCamp in googleCampaigns)
            {
                var existingCamp = await _context.Campaigns
                    .FirstOrDefaultAsync(c => c.WorkspaceId == workspaceId &&
                        (c.ExternalCampaignId == gCamp.Id || (c.Platform.Contains("Google") && c.Name.ToLower() == gCamp.Name.ToLower())));

                if (existingCamp == null)
                {
                    existingCamp = new Campaign
                    {
                        WorkspaceId = workspaceId,
                        ExternalCampaignId = gCamp.Id,
                        Name = gCamp.Name,
                        Platform = "Google Ads",
                        Status = gCamp.Status,
                        Budget = gCamp.Budget,
                        Spend = gCamp.Spend,
                        Clicks = gCamp.Clicks,
                        Impressions = gCamp.Impressions,
                        LeadsCount = 0,
                        Conversions = 0,
                        Revenue = 0,
                        AdAccountId = effectiveCustomerId,
                        PlatformStatus = gCamp.Status,
                        IsLegacy = false,
                        LastSyncedAt = DateTime.UtcNow,
                        SyncStatus = "SYNCED",
                        CreatedAt = gCamp.CreatedAt ?? DateTime.UtcNow
                    };
                    _context.Campaigns.Add(existingCamp);
                }
                else
                {
                    existingCamp.ExternalCampaignId = gCamp.Id;
                    existingCamp.Name = gCamp.Name;
                    existingCamp.Platform = "Google Ads";
                    existingCamp.Status = gCamp.Status;
                    existingCamp.PlatformStatus = gCamp.Status;
                    existingCamp.AdAccountId = effectiveCustomerId;
                    existingCamp.IsLegacy = false;
                    existingCamp.LastSyncedAt = DateTime.UtcNow;
                    existingCamp.SyncStatus = "SYNCED";
                    if (gCamp.Budget > 0) existingCamp.Budget = gCamp.Budget;
                }

                await _context.SaveChangesAsync();
                campaignMap[gCamp.Id] = existingCamp;
                result.CampaignsSynced++;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error syncing Google Ads campaigns for workspace {WorkspaceId}", workspaceId);
            result.Errors.Add($"Campaigns sync error: {ex.Message}");
        }

        // 2. Sync Campaign Metrics (AdMetrics)
        try
        {
            var metricsSummary = await GetCampaignMetricsAsync(effectiveCustomerId, dateRange: "LAST_30_DAYS");

            foreach (var daily in metricsSummary.DailyBreakdown)
            {
                if (!DateOnly.TryParse(daily.Date, out var metricDate)) continue;

                var existingMetric = await _context.AdMetrics
                    .FirstOrDefaultAsync(m => m.WorkspaceId == workspaceId &&
                        m.Platform.Contains("Google") &&
                        m.Date == metricDate);

                if (existingMetric == null)
                {
                    existingMetric = new AdMetrics
                    {
                        WorkspaceId = workspaceId,
                        Platform = "Google Ads",
                        Date = metricDate,
                        Spend = daily.Spend,
                        Clicks = daily.Clicks,
                        Impressions = daily.Impressions,
                        Conversions = daily.Conversions,
                        Cpc = daily.AverageCpc,
                        Ctr = daily.Ctr,
                        LeadsCount = daily.Conversions
                    };
                    _context.AdMetrics.Add(existingMetric);
                }
                else
                {
                    existingMetric.Spend = daily.Spend;
                    existingMetric.Clicks = daily.Clicks;
                    existingMetric.Impressions = daily.Impressions;
                    existingMetric.Conversions = daily.Conversions;
                    existingMetric.Cpc = daily.AverageCpc;
                    existingMetric.Ctr = daily.Ctr;
                    existingMetric.LeadsCount = daily.Conversions;
                }

                result.MetricsSynced++;
            }

            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error syncing Google Ads metrics for workspace {WorkspaceId}", workspaceId);
            result.Errors.Add($"Metrics sync error: {ex.Message}");
        }

        // 3. Sync Lead Form Submissions (Google Lead Ads)
        try
        {
            var submissions = await ListLeadFormSubmissionsAsync(effectiveCustomerId, daysLookback: 60);
            _logger.LogInformation("Retrieved {Count} lead form submissions from Google Ads API.", submissions.Count);

            foreach (var sub in submissions)
            {
                result.LeadsSynced++;

                // Deduplicate by ExternalLeadId (submission ID) or Gclid
                var existingLead = await _context.Leads
                    .FirstOrDefaultAsync(l => l.WorkspaceId == workspaceId &&
                        ((!string.IsNullOrEmpty(sub.SubmissionId) && l.ExternalLeadId == sub.SubmissionId) ||
                         (!string.IsNullOrEmpty(sub.Gclid) && l.Gclid == sub.Gclid)));

                if (existingLead != null)
                {
                    continue; // Deduplicated
                }

                // Associate campaign
                Campaign? matchedCampaign = null;
                if (!string.IsNullOrEmpty(sub.CampaignId) && campaignMap.TryGetValue(sub.CampaignId, out var mappedCamp))
                {
                    matchedCampaign = mappedCamp;
                }

                var newLead = new Lead
                {
                    WorkspaceId = workspaceId,
                    CampaignId = matchedCampaign?.Id,
                    CampaignName = matchedCampaign?.Name ?? "Google Ads Lead Form",
                    Name = !string.IsNullOrWhiteSpace(sub.Name) ? sub.Name : "Google Ads Lead",
                    Email = sub.Email ?? string.Empty,
                    Phone = sub.Phone,
                    Company = sub.Company,
                    Location = sub.Location,
                    SourcePlatform = "Google Ads",
                    ExternalLeadId = sub.SubmissionId,
                    GoogleCustomerId = effectiveCustomerId,
                    Gclid = sub.Gclid,
                    Status = "New",
                    QueueStatus = "IN_QUEUE",
                    Priority = "MEDIUM",
                    QualityScore = 75,
                    QualityTier = "WARM",
                    ConversionProbability = 75.0,
                    RawFormData = JsonSerializer.Serialize(sub.Fields),
                    CreatedAt = sub.SubmissionDateTime != default ? sub.SubmissionDateTime : DateTime.UtcNow
                };

                _context.Leads.Add(newLead);
                await _context.SaveChangesAsync();

                result.NewLeadsCreated++;

                // Broadcast new lead via SignalR WebSocket to frontend listeners
                try
                {
                    var leadDto = new LeadDto
                    {
                        Id = newLead.Id,
                        WorkspaceId = newLead.WorkspaceId,
                        CampaignId = newLead.CampaignId,
                        CampaignName = newLead.CampaignName,
                        Name = newLead.Name,
                        Email = newLead.Email,
                        Phone = newLead.Phone,
                        Company = newLead.Company,
                        Location = newLead.Location,
                        SourcePlatform = newLead.SourcePlatform,
                        Status = newLead.Status,
                        QueueStatus = newLead.QueueStatus,
                        Priority = newLead.Priority,
                        QualityScore = newLead.QualityScore,
                        QualityTier = newLead.QualityTier,
                        CreatedAt = newLead.CreatedAt
                    };

                    await _hubContext.Clients.Group($"workspace_{workspaceId}").SendAsync("ReceiveNewLead", leadDto);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to broadcast new Google Ads lead {LeadId} over WebSocket", newLead.Id);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error syncing Google Ads lead form submissions for workspace {WorkspaceId}", workspaceId);
            result.Errors.Add($"Leads sync error: {ex.Message}");
        }

        result.Success = result.Errors.Count == 0;
        result.Message = result.Success
            ? $"Successfully synced {result.CampaignsSynced} campaigns, {result.MetricsSynced} daily metrics, and created {result.NewLeadsCreated} new leads from Google Ads."
            : $"Google Ads sync completed with {result.Errors.Count} error(s): {string.Join("; ", result.Errors)}";

        _logger.LogInformation("Google Ads sync result for workspace {WorkspaceId}: {Message}", workspaceId, result.Message);
        return result;
    }

    #endregion

    #region Diagnostics & Status

    public async Task<GoogleIntegrationStatusDto> GetStatusAsync(string? customerId = null)
    {
        var effectiveCustomerId = GoogleAdsOptions.FormatCustomerId(!string.IsNullOrWhiteSpace(customerId) ? customerId : _options.CustomerId);
        var status = new GoogleIntegrationStatusDto
        {
            CustomerId = effectiveCustomerId,
            LoginCustomerId = GoogleAdsOptions.FormatCustomerId(_options.LoginCustomerId),
            ApiVersion = string.IsNullOrWhiteSpace(_options.ApiVersion) ? "v19" : _options.ApiVersion,
            HasClientId = !string.IsNullOrWhiteSpace(_options.ClientId),
            HasClientSecret = !string.IsNullOrWhiteSpace(_options.ClientSecret),
            HasRefreshToken = !string.IsNullOrWhiteSpace(_options.RefreshToken),
            IsConfigured = !string.IsNullOrWhiteSpace(_options.ClientId) && !string.IsNullOrWhiteSpace(_options.RefreshToken)
        };

        if (status.IsConfigured)
        {
            try
            {
                var token = await RefreshAccessTokenAsync();
                status.IsAccessTokenValid = !string.IsNullOrWhiteSpace(token);
                status.AccessTokenExpiresAt = _accessTokenExpiresAtUtc;
                status.ValidationMessage = "OAuth token refresh successful. Google Ads API connection ready.";
            }
            catch (Exception ex)
            {
                status.IsAccessTokenValid = false;
                status.ValidationMessage = $"Token refresh failed: {ex.Message}";
            }
        }
        else
        {
            status.ValidationMessage = "Google Ads credentials are not fully configured in appsettings.json.";
        }

        return status;
    }

    public Task<GoogleTokenStatusDto> GetTokenStatusAsync()
    {
        var hasRefreshToken = !string.IsNullOrWhiteSpace(_options.RefreshToken);
        var hasCached = !string.IsNullOrWhiteSpace(_cachedAccessToken);
        var isExpired = _accessTokenExpiresAtUtc <= DateTime.UtcNow;
        var minutesRemaining = hasCached && !isExpired ? (_accessTokenExpiresAtUtc - DateTime.UtcNow).TotalMinutes : 0;

        var tokenStatus = new GoogleTokenStatusDto
        {
            IsConfigured = hasRefreshToken && !string.IsNullOrWhiteSpace(_options.ClientId),
            HasRefreshToken = hasRefreshToken,
            MaskedRefreshToken = MaskToken(_options.RefreshToken),
            HasCachedAccessToken = hasCached,
            MaskedAccessToken = MaskToken(_cachedAccessToken),
            AccessTokenExpiresAt = hasCached ? _accessTokenExpiresAtUtc : null,
            ExpiresInMinutes = hasCached && !isExpired ? Math.Round(minutesRemaining, 1) : null,
            IsExpired = isExpired,
            LastRefreshedAt = _lastRefreshedAtUtc,
            Message = hasRefreshToken
                ? (hasCached && !isExpired ? $"Access token active ({Math.Round(minutesRemaining, 0)} mins remaining)." : "Access token expired or not cached yet.")
                : "No refresh token configured."
        };

        return Task.FromResult(tokenStatus);
    }

    #endregion

    #region Campaign Mutate Operations & Creation

    /// <summary>
    /// Executes a mutate operation on a Google Ads API endpoint.
    /// </summary>
    private async Task<JsonElement> ExecuteMutateAsync(string customerId, string resourcePath, object payload, bool isRetry = false)
    {
        var cleanCustomerId = GoogleAdsOptions.FormatCustomerId(customerId);
        if (string.IsNullOrWhiteSpace(cleanCustomerId))
        {
            cleanCustomerId = GoogleAdsOptions.FormatCustomerId(_options.CustomerId);
        }

        if (string.IsNullOrWhiteSpace(cleanCustomerId))
        {
            throw new InvalidOperationException("Google Ads Customer ID is required for mutate operation.");
        }

        var accessToken = await RefreshAccessTokenAsync(forceRefresh: isRetry);
        var baseUrl = string.IsNullOrWhiteSpace(_options.BaseUrl) ? "https://googleads.googleapis.com" : _options.BaseUrl.TrimEnd('/');
        var apiVersion = string.IsNullOrWhiteSpace(_options.ApiVersion) ? "v19" : _options.ApiVersion;
        var requestUrl = $"{baseUrl}/{apiVersion}/customers/{cleanCustomerId}/{resourcePath}";

        using var request = new HttpRequestMessage(HttpMethod.Post, requestUrl)
        {
            Content = JsonContent.Create(payload)
        };

        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        var devToken = string.IsNullOrWhiteSpace(_options.DeveloperToken) ? "ignored" : _options.DeveloperToken;
        request.Headers.Add("developer-token", devToken);

        var loginCustomerId = GoogleAdsOptions.FormatCustomerId(_options.LoginCustomerId);
        if (!string.IsNullOrWhiteSpace(loginCustomerId))
        {
            request.Headers.Add("login-customer-id", loginCustomerId);
        }

        var response = await _googleAdsHttpClient.SendAsync(request);

        if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized && !isRetry)
        {
            _logger.LogWarning("Received 401 Unauthorized from Google Ads Mutate API. Forcing access token refresh and retrying once...");
            return await ExecuteMutateAsync(cleanCustomerId, resourcePath, payload, isRetry: true);
        }

        var responseBody = await response.Content.ReadAsStringAsync();
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("Google Ads Mutate API failed. HTTP {StatusCode} on {Resource}: {ErrorBody}", response.StatusCode, resourcePath, responseBody);
            try
            {
                var errorObj = JsonSerializer.Deserialize<GoogleAdsErrorResponse>(responseBody, _jsonOptions);
                if (errorObj?.Error != null)
                {
                    throw new HttpRequestException($"Google Ads API Error ({errorObj.Error.Code} {errorObj.Error.Status}): {errorObj.Error.Message}");
                }
            }
            catch (JsonException) { }

            throw new HttpRequestException($"Google Ads API error: HTTP {response.StatusCode} - {responseBody}");
        }

        using var doc = JsonDocument.Parse(responseBody);
        return doc.RootElement.Clone();
    }

    public async Task<PlatformCampaignResultDto> CreateCampaignAsync(CreatePlatformCampaignDto dto, long workspaceId)
    {
        var cleanCustomerId = GoogleAdsOptions.FormatCustomerId(!string.IsNullOrWhiteSpace(dto.AdAccountId) ? dto.AdAccountId : _options.CustomerId);
        if (string.IsNullOrWhiteSpace(cleanCustomerId))
        {
            throw new ArgumentException("Google Ads Customer ID is required to create a campaign.");
        }

        _logger.LogInformation("Creating Google Ads Campaign '{Name}' on Customer '{CustomerId}' for workspace {WorkspaceId}...", dto.Name, cleanCustomerId, workspaceId);

        // 1. Create Campaign Budget
        var budgetMicros = (long)Math.Round(dto.Budget * 1_000_000);
        var budgetPayload = new
        {
            operations = new[]
            {
                new
                {
                    create = new
                    {
                        name = $"{dto.Name} Budget ({DateTime.UtcNow.Ticks})",
                        amountMicros = budgetMicros.ToString(),
                        deliveryMethod = "STANDARD",
                        explicitlyShared = false
                    }
                }
            }
        };

        var budgetResponse = await ExecuteMutateAsync(cleanCustomerId, "campaignBudgets:mutate", budgetPayload);
        var budgetResults = budgetResponse.GetProperty("results");
        var budgetResourceName = budgetResults[0].GetProperty("resourceName").GetString()!;

        // 2. Determine channel type
        var channelType = "SEARCH";
        var objUpper = (dto.Objective ?? "").ToUpperInvariant();
        if (objUpper.Contains("PERFORMANCE_MAX") || objUpper.Contains("PMAX")) channelType = "PERFORMANCE_MAX";
        else if (objUpper.Contains("DISPLAY")) channelType = "DISPLAY";
        else if (objUpper.Contains("VIDEO") || objUpper.Contains("YOUTUBE")) channelType = "VIDEO";

        // 3. Create Campaign
        var status = (dto.Status ?? "PAUSED").Equals("ACTIVE", StringComparison.OrdinalIgnoreCase) ? "ENABLED" : "PAUSED";
        var campaignPayload = new
        {
            operations = new[]
            {
                new
                {
                    create = new
                    {
                        name = dto.Name,
                        status = status,
                        advertisingChannelType = channelType,
                        campaignBudget = budgetResourceName,
                        manualCpc = new { }
                    }
                }
            }
        };

        var campaignResponse = await ExecuteMutateAsync(cleanCustomerId, "campaigns:mutate", campaignPayload);
        var campaignResults = campaignResponse.GetProperty("results");
        var campaignResourceName = campaignResults[0].GetProperty("resourceName").GetString()!;
        var campaignId = ExtractResourceSuffix(campaignResourceName);

        // 4. Upsert into LeadGrowth Campaigns database
        var dbCampaign = await _context.Campaigns
            .FirstOrDefaultAsync(c => c.WorkspaceId == workspaceId && c.ExternalCampaignId == campaignId);

        if (dbCampaign == null)
        {
            dbCampaign = new Campaign
            {
                WorkspaceId = workspaceId,
                Name = dto.Name,
                Platform = "Google Ads",
                Status = dto.Status ?? "PAUSED",
                Budget = dto.Budget,
                Spend = 0,
                Clicks = 0,
                Impressions = 0,
                LeadsCount = 0,
                Conversions = 0,
                Revenue = 0,
                ExternalCampaignId = campaignId,
                AdAccountId = cleanCustomerId,
                Objective = dto.Objective,
                Placements = "Google Search & Partners",
                PlatformStatus = dto.Status ?? "PAUSED",
                IsLegacy = false,
                LastSyncedAt = DateTime.UtcNow,
                SyncStatus = "SYNCED",
                CreatedAt = DateTime.UtcNow
            };
            _context.Campaigns.Add(dbCampaign);
        }
        else
        {
            dbCampaign.Name = dto.Name;
            dbCampaign.Budget = dto.Budget;
            dbCampaign.Status = dto.Status ?? dbCampaign.Status;
            dbCampaign.PlatformStatus = dto.Status ?? dbCampaign.PlatformStatus;
            dbCampaign.IsLegacy = false;
            dbCampaign.LastSyncedAt = DateTime.UtcNow;
            dbCampaign.SyncStatus = "SYNCED";
        }

        await _context.SaveChangesAsync();

        return new PlatformCampaignResultDto
        {
            Success = true,
            Message = $"Google Ads campaign '{dto.Name}' successfully created on {cleanCustomerId}.",
            CampaignId = dbCampaign.Id,
            ExternalCampaignId = campaignId,
            AdAccountId = cleanCustomerId,
            Platform = "Google Ads",
            PlatformStatus = dbCampaign.PlatformStatus ?? "PAUSED",
            Placements = "Google Search & Partners"
        };
    }

    public async Task<bool> UpdateCampaignStatusAsync(string customerId, string campaignId, string status)
    {
        var cleanCustomerId = GoogleAdsOptions.FormatCustomerId(customerId);
        if (string.IsNullOrWhiteSpace(cleanCustomerId)) cleanCustomerId = GoogleAdsOptions.FormatCustomerId(_options.CustomerId);
        
        var targetStatus = status.Equals("ACTIVE", StringComparison.OrdinalIgnoreCase) ? "ENABLED" : "PAUSED";
        _logger.LogInformation("Updating Google Campaign {CampaignId} status to {Status} on customer {CustomerId}...", campaignId, targetStatus, cleanCustomerId);

        var payload = new
        {
            operations = new[]
            {
                new
                {
                    update = new
                    {
                        resourceName = $"customers/{cleanCustomerId}/campaigns/{campaignId}",
                        status = targetStatus
                    },
                    updateMask = "status"
                }
            }
        };

        await ExecuteMutateAsync(cleanCustomerId, "campaigns:mutate", payload);
        return true;
    }

    public async Task<bool> UpdateCampaignBudgetAsync(string customerId, string campaignId, decimal dailyBudget)
    {
        var cleanCustomerId = GoogleAdsOptions.FormatCustomerId(customerId);
        if (string.IsNullOrWhiteSpace(cleanCustomerId)) cleanCustomerId = GoogleAdsOptions.FormatCustomerId(_options.CustomerId);

        _logger.LogInformation("Looking up campaign budget for Google Campaign {CampaignId} on customer {CustomerId}...", campaignId, cleanCustomerId);

        var gaql = $"SELECT campaign.campaign_budget FROM campaign WHERE campaign.id = '{campaignId}'";
        var searchRes = await ExecuteGaqlAsync(cleanCustomerId, gaql);

        var budgetResource = searchRes.Results.FirstOrDefault()?.Campaign?.CampaignBudget;
        if (string.IsNullOrWhiteSpace(budgetResource))
        {
            throw new InvalidOperationException($"Could not find budget resource for Google Campaign {campaignId}");
        }

        var amountMicros = (long)Math.Round(dailyBudget * 1_000_000);
        var payload = new
        {
            operations = new[]
            {
                new
                {
                    update = new
                    {
                        resourceName = budgetResource,
                        amountMicros = amountMicros.ToString()
                    },
                    updateMask = "amount_micros"
                }
            }
        };

        await ExecuteMutateAsync(cleanCustomerId, "campaignBudgets:mutate", payload);
        return true;
    }

    public Task<List<AdAccountInfoDto>> ListConnectedAdAccountsAsync()
    {
        var result = new List<AdAccountInfoDto>();
        var configuredCustomer = GoogleAdsOptions.FormatCustomerId(_options.CustomerId);

        if (!string.IsNullOrWhiteSpace(configuredCustomer))
        {
            result.Add(new AdAccountInfoDto
            {
                Platform = "Google",
                AccountId = configuredCustomer,
                AccountName = "Connected Google Ads Account",
                Currency = "USD",
                Status = "ACTIVE",
                IsDefault = true
            });
        }

        var loginCustomer = GoogleAdsOptions.FormatCustomerId(_options.LoginCustomerId);
        if (!string.IsNullOrWhiteSpace(loginCustomer) && !loginCustomer.Equals(configuredCustomer, StringComparison.OrdinalIgnoreCase))
        {
            result.Add(new AdAccountInfoDto
            {
                Platform = "Google",
                AccountId = loginCustomer,
                AccountName = "Google Ads Manager (MCC) Account",
                Currency = "USD",
                Status = "ACTIVE",
                IsDefault = false
            });
        }

        return Task.FromResult(result);
    }

    #endregion

    #region Helper Methods

    private static string MapGoogleCampaignStatus(string? status)
    {
        if (string.IsNullOrWhiteSpace(status)) return "ACTIVE";
        var s = status.Trim().ToUpperInvariant();
        return s switch
        {
            "ENABLED" => "ACTIVE",
            "PAUSED" => "PAUSED",
            "REMOVED" => "ARCHIVED",
            _ => s
        };
    }

    private static string ExtractResourceSuffix(string? resourceName)
    {
        if (string.IsNullOrWhiteSpace(resourceName)) return string.Empty;
        var lastSlash = resourceName.LastIndexOf('/');
        return lastSlash >= 0 ? resourceName[(lastSlash + 1)..] : resourceName;
    }

    private static long ParseLong(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return 0;
        return long.TryParse(value, out var result) ? result : 0;
    }

    private static DateTime? ParseGoogleDate(string? dateStr)
    {
        if (string.IsNullOrWhiteSpace(dateStr)) return null;
        return DateTime.TryParse(dateStr, out var dt) ? DateTime.SpecifyKind(dt, DateTimeKind.Utc) : null;
    }

    private static DateTime ParseGoogleDateTime(string? dateTimeStr)
    {
        if (string.IsNullOrWhiteSpace(dateTimeStr)) return DateTime.UtcNow;
        return DateTime.TryParse(dateTimeStr, out var dt) ? dt.ToUniversalTime() : DateTime.UtcNow;
    }

    private static bool IsConvertedStatus(string? status)
    {
        if (string.IsNullOrWhiteSpace(status)) return false;
        var s = status.Trim();
        return s.Equals("Converted", StringComparison.OrdinalIgnoreCase) ||
               s.Equals("Closed Won", StringComparison.OrdinalIgnoreCase) ||
               s.Equals("Closed_Won", StringComparison.OrdinalIgnoreCase) ||
               s.Equals("Won", StringComparison.OrdinalIgnoreCase) ||
               s.Equals("Payment Completed", StringComparison.OrdinalIgnoreCase);
    }

    private static string? MaskToken(string? token)
    {
        if (string.IsNullOrWhiteSpace(token)) return null;
        var trimmed = token.Trim();
        if (trimmed.Length <= 8) return "••••••••";
        return $"{trimmed[..4]}••••••••{trimmed[^4..]}";
    }

    #endregion
}
