namespace LeadGrowth.Models;

/// <summary>
/// Options and credentials for Meta Marketing API Integration.
/// </summary>
public class MetaAdsOptions
{
    public const string SectionName = "MetaAds";

    public string AppId { get; set; } = string.Empty;
    public string AppSecret { get; set; } = string.Empty;

    /// <summary>
    /// Initial bootstrap seed for User Access Token.
    /// Exchanged for long-lived (~60 days) token on first run and persisted in meta_tokens table.
    /// </summary>
    public string UserAccessToken { get; set; } = string.Empty;

    /// <summary>
    /// Initial bootstrap seed for Page Access Token.
    /// Re-fetched automatically using long-lived User token and persisted in meta_tokens table.
    /// </summary>
    public string PageAccessToken { get; set; } = string.Empty;

    public string AdAccountId { get; set; } = "act_1761059741702786";
    public string PageId { get; set; } = "1391100724075709";
    public string BusinessManagerId { get; set; } = string.Empty;
    public string ApiVersion { get; set; } = "v25.0";
    public string BaseUrl { get; set; } = "https://graph.facebook.com";

    /// <summary>
    /// Formats the ad account ID to ensure it is prefixed with 'act_'.
    /// </summary>
    public string FormattedAdAccountId
    {
        get
        {
            if (string.IsNullOrWhiteSpace(AdAccountId)) return string.Empty;
            return AdAccountId.StartsWith("act_") ? AdAccountId : $"act_{AdAccountId}";
        }
    }
}
