using System.Text.Json.Serialization;

namespace LeadGrowth.DTOs;

#region Google Ads API Raw Response & Request Shapes

public class GoogleOAuthTokenResponse
{
    [JsonPropertyName("access_token")]
    public string AccessToken { get; set; } = string.Empty;

    [JsonPropertyName("expires_in")]
    public long ExpiresIn { get; set; } = 3600;

    [JsonPropertyName("token_type")]
    public string? TokenType { get; set; } = "Bearer";

    [JsonPropertyName("scope")]
    public string? Scope { get; set; }
}

public class GoogleAdsSearchRequest
{
    [JsonPropertyName("query")]
    public string Query { get; set; } = string.Empty;

    [JsonPropertyName("pageSize")]
    public int? PageSize { get; set; } = 10000;
}

public class GoogleAdsSearchResponse
{
    [JsonPropertyName("results")]
    public List<GoogleAdsRow> Results { get; set; } = new();

    [JsonPropertyName("nextPageToken")]
    public string? NextPageToken { get; set; }

    [JsonPropertyName("totalResultsCount")]
    public long? TotalResultsCount { get; set; }

    [JsonPropertyName("fieldMask")]
    public string? FieldMask { get; set; }
}

public class GoogleAdsRow
{
    [JsonPropertyName("campaign")]
    public GoogleCampaignResource? Campaign { get; set; }

    [JsonPropertyName("campaignBudget")]
    public GoogleCampaignBudgetResource? CampaignBudget { get; set; }

    [JsonPropertyName("metrics")]
    public GoogleMetricsResource? Metrics { get; set; }

    [JsonPropertyName("segments")]
    public GoogleSegmentsResource? Segments { get; set; }

    [JsonPropertyName("leadFormSubmissionData")]
    public GoogleLeadFormSubmissionDataResource? LeadFormSubmissionData { get; set; }
}

public class GoogleCampaignResource
{
    [JsonPropertyName("resourceName")]
    public string? ResourceName { get; set; }

    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("status")]
    public string? Status { get; set; } // "ENABLED", "PAUSED", "REMOVED"

    [JsonPropertyName("advertisingChannelType")]
    public string? AdvertisingChannelType { get; set; } // "SEARCH", "DISPLAY", "PERFORMANCE_MAX", "VIDEO", etc.

    [JsonPropertyName("campaignBudget")]
    public string? CampaignBudget { get; set; }

    [JsonPropertyName("startDate")]
    public string? StartDate { get; set; }

    [JsonPropertyName("endDate")]
    public string? EndDate { get; set; }
}

public class GoogleCampaignBudgetResource
{
    [JsonPropertyName("resourceName")]
    public string? ResourceName { get; set; }

    [JsonPropertyName("id")]
    public string? Id { get; set; }

    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("amountMicros")]
    public string? AmountMicros { get; set; } // 1,000,000 micros = 1 currency unit
}

public class GoogleMetricsResource
{
    [JsonPropertyName("impressions")]
    public string? Impressions { get; set; } = "0";

    [JsonPropertyName("clicks")]
    public string? Clicks { get; set; } = "0";

    [JsonPropertyName("costMicros")]
    public string? CostMicros { get; set; } = "0"; // spend = costMicros / 1,000,000

    [JsonPropertyName("ctr")]
    public double? Ctr { get; set; } // Ratio e.g. 0.0523 for 5.23%

    [JsonPropertyName("averageCpc")]
    public double? AverageCpc { get; set; } // in micros e.g. 2500000 = 2.50

    [JsonPropertyName("averageCpm")]
    public double? AverageCpm { get; set; } // in micros

    [JsonPropertyName("conversions")]
    public double? Conversions { get; set; } = 0;

    [JsonPropertyName("conversionsValue")]
    public double? ConversionsValue { get; set; } = 0;

    [JsonPropertyName("costPerConversion")]
    public double? CostPerConversion { get; set; } // in micros
}

public class GoogleSegmentsResource
{
    [JsonPropertyName("date")]
    public string? Date { get; set; } // "YYYY-MM-DD"
}

public class GoogleLeadFormSubmissionDataResource
{
    [JsonPropertyName("resourceName")]
    public string? ResourceName { get; set; }

    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("asset")]
    public string? Asset { get; set; }

    [JsonPropertyName("campaign")]
    public string? Campaign { get; set; } // "customers/5929594590/campaigns/123456"

    [JsonPropertyName("adGroupAd")]
    public string? AdGroupAd { get; set; }

    [JsonPropertyName("gclid")]
    public string? Gclid { get; set; }

    [JsonPropertyName("submissionDateTime")]
    public string? SubmissionDateTime { get; set; } // "YYYY-MM-DD HH:MM:SS+TZ"

    [JsonPropertyName("leadFormSubmissionFields")]
    public List<GoogleLeadFormField> LeadFormSubmissionFields { get; set; } = new();
}

public class GoogleLeadFormField
{
    [JsonPropertyName("fieldType")]
    public string FieldType { get; set; } = string.Empty; // "FULL_NAME", "EMAIL", "PHONE_NUMBER", "COMPANY_NAME", "CITY", etc.

    [JsonPropertyName("fieldValue")]
    public string FieldValue { get; set; } = string.Empty;
}

public class GoogleAdsErrorResponse
{
    [JsonPropertyName("error")]
    public GoogleAdsErrorContainer? Error { get; set; }
}

public class GoogleAdsErrorContainer
{
    [JsonPropertyName("code")]
    public int Code { get; set; }

    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;

    [JsonPropertyName("status")]
    public string? Status { get; set; }

    [JsonPropertyName("details")]
    public List<object>? Details { get; set; }
}

#endregion

#region LeadGrowth Application-Level DTOs

public class GoogleCampaignDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Status { get; set; } = "ACTIVE"; // "ACTIVE", "PAUSED", "ARCHIVED"
    public string? ChannelType { get; set; }
    public decimal Budget { get; set; }
    public decimal Spend { get; set; }
    public int Impressions { get; set; }
    public int Clicks { get; set; }
    public decimal Ctr { get; set; }
    public decimal AverageCpc { get; set; }
    public int Conversions { get; set; }
    public decimal Revenue { get; set; }
    public DateTime? CreatedAt { get; set; }
}

public class GoogleCampaignMetricsSummaryDto
{
    public string CustomerId { get; set; } = string.Empty;
    public string? CampaignId { get; set; }
    public string? CampaignName { get; set; }
    public int Impressions { get; set; }
    public int Clicks { get; set; }
    public decimal Spend { get; set; }
    public decimal AverageCpc { get; set; }
    public decimal AverageCpm { get; set; }
    public decimal Ctr { get; set; }
    public int Conversions { get; set; }
    public decimal CostPerConversion { get; set; }
    public decimal InternalRevenue { get; set; }
    public int InternalConvertedLeads { get; set; }
    public decimal InternalRoas { get; set; }
    public decimal InternalNetProfit { get; set; }
    public string? DateStart { get; set; }
    public string? DateStop { get; set; }
    public List<GoogleDailyMetricItemDto> DailyBreakdown { get; set; } = new();
}

public class GoogleDailyMetricItemDto
{
    public string Date { get; set; } = string.Empty;
    public int Impressions { get; set; }
    public int Clicks { get; set; }
    public decimal Spend { get; set; }
    public decimal AverageCpc { get; set; }
    public decimal Ctr { get; set; }
    public int Conversions { get; set; }
}

public class GoogleLeadDto
{
    public string SubmissionId { get; set; } = string.Empty;
    public string? CampaignId { get; set; }
    public string? CampaignName { get; set; }
    public string? Name { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Company { get; set; }
    public string? Location { get; set; }
    public string? Gclid { get; set; }
    public string? AssetId { get; set; }
    public DateTime SubmissionDateTime { get; set; }
    public Dictionary<string, string> Fields { get; set; } = new();
}

public class GoogleSyncResultDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public int CampaignsSynced { get; set; }
    public int MetricsSynced { get; set; }
    public int LeadsSynced { get; set; }
    public int NewLeadsCreated { get; set; }
    public List<string> Errors { get; set; } = new();
    public DateTime SyncedAt { get; set; } = DateTime.UtcNow;
}

public class GoogleIntegrationStatusDto
{
    public bool IsConfigured { get; set; }
    public string CustomerId { get; set; } = string.Empty;
    public string LoginCustomerId { get; set; } = string.Empty;
    public string ApiVersion { get; set; } = "v19";
    public bool HasClientId { get; set; }
    public bool HasClientSecret { get; set; }
    public bool HasRefreshToken { get; set; }
    public bool IsAccessTokenValid { get; set; }
    public DateTime? AccessTokenExpiresAt { get; set; }
    public string? ValidationMessage { get; set; }
    public DateTime? LastSyncedAt { get; set; }
}

public class GoogleTokenStatusDto
{
    public bool IsConfigured { get; set; }
    public bool HasRefreshToken { get; set; }
    public string? MaskedRefreshToken { get; set; }
    public bool HasCachedAccessToken { get; set; }
    public string? MaskedAccessToken { get; set; }
    public DateTime? AccessTokenExpiresAt { get; set; }
    public double? ExpiresInMinutes { get; set; }
    public bool IsExpired { get; set; }
    public DateTime? LastRefreshedAt { get; set; }
    public string Message { get; set; } = string.Empty;
}

#endregion
