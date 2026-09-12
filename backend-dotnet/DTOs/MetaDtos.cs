using System.Text.Json.Serialization;

namespace LeadGrowth.DTOs;

#region Meta Graph API Raw Response & Request Shapes

public class MetaIdResponse
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;
}

public class MetaPaging
{
    [JsonPropertyName("cursors")]
    public MetaCursors? Cursors { get; set; }

    [JsonPropertyName("next")]
    public string? Next { get; set; }

    [JsonPropertyName("previous")]
    public string? Previous { get; set; }
}

public class MetaCursors
{
    [JsonPropertyName("before")]
    public string? Before { get; set; }

    [JsonPropertyName("after")]
    public string? After { get; set; }
}

public class MetaErrorResponse
{
    [JsonPropertyName("error")]
    public MetaErrorDetail? Error { get; set; }
}

public class MetaErrorDetail
{
    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;

    [JsonPropertyName("type")]
    public string? Type { get; set; }

    [JsonPropertyName("code")]
    public int Code { get; set; }

    [JsonPropertyName("error_subcode")]
    public int? ErrorSubcode { get; set; }

    [JsonPropertyName("fbtrace_id")]
    public string? FbTraceId { get; set; }
}

public class MetaOAuthTokenResponse
{
    [JsonPropertyName("access_token")]
    public string AccessToken { get; set; } = string.Empty;

    [JsonPropertyName("token_type")]
    public string? TokenType { get; set; }

    [JsonPropertyName("expires_in")]
    public long? ExpiresIn { get; set; }
}

// 1. Campaign Models
public class MetaCampaignListResponse
{
    [JsonPropertyName("data")]
    public List<MetaCampaignItem> Data { get; set; } = new();

    [JsonPropertyName("paging")]
    public MetaPaging? Paging { get; set; }
}

public class MetaCampaignItem
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("status")]
    public string? Status { get; set; }

    [JsonPropertyName("objective")]
    public string? Objective { get; set; }

    [JsonPropertyName("daily_budget")]
    public string? DailyBudget { get; set; }

    [JsonPropertyName("lifetime_budget")]
    public string? LifetimeBudget { get; set; }

    [JsonPropertyName("budget_remaining")]
    public string? BudgetRemaining { get; set; }

    [JsonPropertyName("start_time")]
    public string? StartTime { get; set; }

    [JsonPropertyName("stop_time")]
    public string? StopTime { get; set; }

    [JsonPropertyName("created_time")]
    public string? CreatedTime { get; set; }

    [JsonPropertyName("updated_time")]
    public string? UpdatedTime { get; set; }
}

// 2. AdSet Models
public class MetaPromotedObject
{
    [JsonPropertyName("page_id")]
    public string PageId { get; set; } = string.Empty;
}

public class MetaGeoLocations
{
    [JsonPropertyName("countries")]
    public List<string> Countries { get; set; } = new() { "US" };
}

public class MetaTargeting
{
    [JsonPropertyName("geo_locations")]
    public MetaGeoLocations GeoLocations { get; set; } = new();

    [JsonPropertyName("age_min")]
    public int? AgeMin { get; set; } = 18;

    [JsonPropertyName("age_max")]
    public int? AgeMax { get; set; } = 65;
}

// 3. Insights Models
public class MetaInsightsResponse
{
    [JsonPropertyName("data")]
    public List<MetaInsightItem> Data { get; set; } = new();

    [JsonPropertyName("paging")]
    public MetaPaging? Paging { get; set; }
}

public class MetaInsightItem
{
    [JsonPropertyName("impressions")]
    public string? Impressions { get; set; }

    [JsonPropertyName("clicks")]
    public string? Clicks { get; set; }

    [JsonPropertyName("spend")]
    public string? Spend { get; set; }

    [JsonPropertyName("reach")]
    public string? Reach { get; set; }

    [JsonPropertyName("frequency")]
    public string? Frequency { get; set; }

    [JsonPropertyName("cpc")]
    public string? Cpc { get; set; }

    [JsonPropertyName("cpm")]
    public string? Cpm { get; set; }

    [JsonPropertyName("ctr")]
    public string? Ctr { get; set; }

    [JsonPropertyName("actions")]
    public List<MetaActionItem>? Actions { get; set; }

    [JsonPropertyName("cost_per_action_type")]
    public List<MetaCostPerActionItem>? CostPerActionType { get; set; }

    [JsonPropertyName("date_start")]
    public string? DateStart { get; set; }

    [JsonPropertyName("date_stop")]
    public string? DateStop { get; set; }
}

public class MetaActionItem
{
    [JsonPropertyName("action_type")]
    public string ActionType { get; set; } = string.Empty;

    [JsonPropertyName("value")]
    public string Value { get; set; } = "0";
}

public class MetaCostPerActionItem
{
    [JsonPropertyName("action_type")]
    public string ActionType { get; set; } = string.Empty;

    [JsonPropertyName("value")]
    public string Value { get; set; } = "0";
}

// 4. Lead Form Models
public class MetaLeadGenQuestion
{
    [JsonPropertyName("type")]
    public string Type { get; set; } = "FULL_NAME"; // FULL_NAME, EMAIL, PHONE, etc.

    [JsonPropertyName("key")]
    public string? Key { get; set; }

    [JsonPropertyName("label")]
    public string? Label { get; set; }
}

public class MetaPrivacyPolicy
{
    [JsonPropertyName("url")]
    public string Url { get; set; } = string.Empty;

    [JsonPropertyName("link_text")]
    public string LinkText { get; set; } = "Privacy Policy";
}

public class MetaLeadFormListResponse
{
    [JsonPropertyName("data")]
    public List<MetaLeadFormItem> Data { get; set; } = new();

    [JsonPropertyName("paging")]
    public MetaPaging? Paging { get; set; }
}

public class MetaLeadFormItem
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("status")]
    public string? Status { get; set; }

    [JsonPropertyName("created_time")]
    public string? CreatedTime { get; set; }

    [JsonPropertyName("follow_up_action_url")]
    public string? FollowUpActionUrl { get; set; }

    [JsonPropertyName("leads_count")]
    public int? LeadsCount { get; set; }
}

// 5. Leads Data Models
public class MetaLeadsResponse
{
    [JsonPropertyName("data")]
    public List<MetaLeadItem> Data { get; set; } = new();

    [JsonPropertyName("paging")]
    public MetaPaging? Paging { get; set; }
}

public class MetaLeadItem
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("created_time")]
    public string? CreatedTime { get; set; }

    [JsonPropertyName("field_data")]
    public List<MetaFieldDataItem>? FieldData { get; set; }

    [JsonPropertyName("platform")]
    public string? Platform { get; set; } // "fb", "ig", or null for organic/test leads

    [JsonPropertyName("ad_id")]
    public string? AdId { get; set; }

    [JsonPropertyName("ad_name")]
    public string? AdName { get; set; }

    [JsonPropertyName("adset_id")]
    public string? AdsetId { get; set; }

    [JsonPropertyName("adset_name")]
    public string? AdsetName { get; set; }

    [JsonPropertyName("campaign_id")]
    public string? CampaignId { get; set; }

    [JsonPropertyName("campaign_name")]
    public string? CampaignName { get; set; }

    [JsonPropertyName("is_organic")]
    public bool? IsOrganic { get; set; }
}

public class MetaFieldDataItem
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("values")]
    public List<string> Values { get; set; } = new();
}

// 6. Owned Pages Models
public class MetaOwnedPagesResponse
{
    [JsonPropertyName("data")]
    public List<MetaOwnedPageItem> Data { get; set; } = new();

    [JsonPropertyName("paging")]
    public MetaPaging? Paging { get; set; }
}

public class MetaOwnedPageItem
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("access_token")]
    public string? AccessToken { get; set; }
}

#endregion

#region LeadGrowth Application Level DTOs (Request / Response)

public class CreateMetaCampaignDto
{
    public string Name { get; set; } = string.Empty;
    public string Objective { get; set; } = "OUTCOME_LEADS"; // OUTCOME_LEADS, OUTCOME_TRAFFIC, etc.
    public string Status { get; set; } = "PAUSED"; // PAUSED, ACTIVE
    public List<string> SpecialAdCategories { get; set; } = new() { "NONE" };
    public bool IsAdsetBudgetSharingEnabled { get; set; } = false;
    public decimal? DailyBudget { get; set; }
    public string? AdAccountId { get; set; }
    public string? UserAccessToken { get; set; }
}

public class CreateMetaAdSetDto
{
    public string Name { get; set; } = string.Empty;
    public string CampaignId { get; set; } = string.Empty;
    public decimal DailyBudget { get; set; } = 1000m; // E.g. in cents (1000 = $10.00) or workspace currency
    public string BillingEvent { get; set; } = "IMPRESSIONS";
    public string OptimizationGoal { get; set; } = "LEAD_GENERATION";
    public string? BidStrategy { get; set; } = "LOWEST_COST_WITHOUT_CAP";
    public string? PageId { get; set; }
    public List<string> TargetCountries { get; set; } = new() { "US" };
    public int AgeMin { get; set; } = 18;
    public int AgeMax { get; set; } = 65;
    public string Status { get; set; } = "PAUSED";
    public string? AdAccountId { get; set; }
    public string? UserAccessToken { get; set; }
}

public class CreateMetaLeadFormDto
{
    public string Name { get; set; } = string.Empty;
    public string FollowUpActionUrl { get; set; } = "https://hoossh.com";
    public List<string> Questions { get; set; } = new() { "FULL_NAME", "EMAIL", "PHONE" };
    public string PrivacyPolicyUrl { get; set; } = "https://hoossh.com/privacy";
    public string PrivacyPolicyLinkText { get; set; } = "Privacy Policy";
    public string? PageId { get; set; }
    public string? PageAccessToken { get; set; }
}

public class MetaInsightSummaryDto
{
    public string CampaignId { get; set; } = string.Empty;
    public string? CampaignName { get; set; }
    public int Impressions { get; set; }
    public int Clicks { get; set; }
    public decimal Spend { get; set; }
    public int Reach { get; set; }
    public decimal Frequency { get; set; }
    public decimal Cpc { get; set; }
    public decimal Cpm { get; set; }
    public decimal Ctr { get; set; }
    public int LeadsCount { get; set; }
    public decimal CostPerLead { get; set; }
    public decimal InternalRevenue { get; set; }
    public int InternalConversions { get; set; }
    public decimal InternalRoas { get; set; }
    public decimal InternalNetProfit { get; set; }
    public string? DateStart { get; set; }
    public string? DateStop { get; set; }
    public List<MetaInsightItem> DailyBreakdown { get; set; } = new();
}

public class MetaSyncResultDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public int CampaignsSynced { get; set; }
    public int InsightsSynced { get; set; }
    public int FormsSynced { get; set; }
    public int LeadsSynced { get; set; }
    public int NewLeadsCreated { get; set; }
    public List<string> Errors { get; set; } = new();
    public DateTime SyncedAt { get; set; } = DateTime.UtcNow;
}

public class MetaIntegrationStatusDto
{
    public bool IsConfigured { get; set; }
    public string AdAccountId { get; set; } = string.Empty;
    public string PageId { get; set; } = string.Empty;
    public string ApiVersion { get; set; } = "v25.0";
    public bool HasUserToken { get; set; }
    public bool HasPageToken { get; set; }
    public bool IsUserTokenValid { get; set; }
    public bool IsPageTokenValid { get; set; }
    public string? TokenValidationMessage { get; set; }
    public DateTime? LastSyncedAt { get; set; }
}

public class MetaTokenInfo
{
    public bool HasToken { get; set; }
    public string? MaskedToken { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public double? ExpiresInDays { get; set; }
    public bool IsExpiringSoon { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string Source { get; set; } = "None"; // "Database", "Config", "None"
}

public class MetaTokenStatusDto
{
    public bool IsConfigured { get; set; }
    public MetaTokenInfo UserToken { get; set; } = new();
    public MetaTokenInfo PageToken { get; set; } = new();
    public DateTime? LastRefreshedAt { get; set; }
    public string Message { get; set; } = string.Empty;
}

public class ExchangeTokenRequestDto
{
    public string? Token { get; set; }
    public string? TokenType { get; set; } = "User";
}

#endregion
