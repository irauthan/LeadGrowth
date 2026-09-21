using System.Text.Json.Serialization;

namespace LeadGrowth.DTOs;

public class CreatePlatformCampaignDto
{
    [JsonPropertyName("platform")]
    public string Platform { get; set; } = "Meta"; // "Meta" or "Google"

    [JsonPropertyName("adAccountId")]
    public string AdAccountId { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("objective")]
    public string Objective { get; set; } = "OUTCOME_LEADS";

    [JsonPropertyName("budget")]
    public decimal Budget { get; set; } = 50.00m;

    [JsonPropertyName("status")]
    public string Status { get; set; } = "PAUSED"; // "PAUSED" or "ACTIVE"

    [JsonPropertyName("placements")]
    public List<string> Placements { get; set; } = new() { "facebook", "instagram" };

    [JsonPropertyName("pageId")]
    public string? PageId { get; set; }

    [JsonPropertyName("instagramActorId")]
    public string? InstagramActorId { get; set; }

    [JsonPropertyName("targetCountries")]
    public List<string> TargetCountries { get; set; } = new() { "US" };

    [JsonPropertyName("ageMin")]
    public int AgeMin { get; set; } = 18;

    [JsonPropertyName("ageMax")]
    public int AgeMax { get; set; } = 65;

    [JsonPropertyName("adHeadline")]
    public string? AdHeadline { get; set; }

    [JsonPropertyName("adPrimaryText")]
    public string? AdPrimaryText { get; set; }

    [JsonPropertyName("adDestinationUrl")]
    public string? AdDestinationUrl { get; set; }

    [JsonPropertyName("callToAction")]
    public string CallToAction { get; set; } = "LEARN_MORE";

    [JsonPropertyName("leadFormId")]
    public string? LeadFormId { get; set; }

    [JsonPropertyName("biddingStrategy")]
    public string? BiddingStrategy { get; set; }

    [JsonPropertyName("startDate")]
    public string? StartDate { get; set; }

    [JsonPropertyName("endDate")]
    public string? EndDate { get; set; }
}

public class AdAccountInfoDto
{
    [JsonPropertyName("platform")]
    public string Platform { get; set; } = string.Empty;

    [JsonPropertyName("accountId")]
    public string AccountId { get; set; } = string.Empty;

    [JsonPropertyName("accountName")]
    public string AccountName { get; set; } = string.Empty;

    [JsonPropertyName("currency")]
    public string Currency { get; set; } = "USD";

    [JsonPropertyName("status")]
    public string Status { get; set; } = "ACTIVE";

    [JsonPropertyName("isDefault")]
    public bool IsDefault { get; set; }

    [JsonPropertyName("pages")]
    public List<MetaPageOptionDto> Pages { get; set; } = new();
}

public class MetaPageOptionDto
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("category")]
    public string? Category { get; set; }

    [JsonPropertyName("instagramAccounts")]
    public List<string> InstagramAccounts { get; set; } = new();
}

public class CampaignSyncStatusDto
{
    [JsonPropertyName("lastSyncedAt")]
    public DateTime? LastSyncedAt { get; set; }

    [JsonPropertyName("isMetaConnected")]
    public bool IsMetaConnected { get; set; }

    [JsonPropertyName("isGoogleConnected")]
    public bool IsGoogleConnected { get; set; }

    [JsonPropertyName("metaAccountName")]
    public string? MetaAccountName { get; set; }

    [JsonPropertyName("googleAccountName")]
    public string? GoogleAccountName { get; set; }

    [JsonPropertyName("lastMetaError")]
    public string? LastMetaError { get; set; }

    [JsonPropertyName("lastGoogleError")]
    public string? LastGoogleError { get; set; }

    [JsonPropertyName("totalCampaignsSynced")]
    public int TotalCampaignsSynced { get; set; }
}

public class PlatformCampaignResultDto
{
    [JsonPropertyName("success")]
    public bool Success { get; set; }

    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;

    [JsonPropertyName("campaignId")]
    public long CampaignId { get; set; }

    [JsonPropertyName("externalCampaignId")]
    public string? ExternalCampaignId { get; set; }

    [JsonPropertyName("adAccountId")]
    public string? AdAccountId { get; set; }

    [JsonPropertyName("platform")]
    public string Platform { get; set; } = string.Empty;

    [JsonPropertyName("platformStatus")]
    public string PlatformStatus { get; set; } = "PAUSED";

    [JsonPropertyName("placements")]
    public string? Placements { get; set; }
}
