namespace LeadGrowth.Models;

/// <summary>
/// Options and credentials for Google Ads API Integration.
/// </summary>
public class GoogleAdsOptions
{
    public const string SectionName = "GoogleAds";

    /// <summary>
    /// OAuth 2.0 Client ID ("Web application" type).
    /// </summary>
    public string ClientId { get; set; } = string.Empty;

    /// <summary>
    /// OAuth 2.0 Client Secret.
    /// </summary>
    public string ClientSecret { get; set; } = string.Empty;

    /// <summary>
    /// Long-lived Refresh Token obtained via OAuth consent (does not expire under normal use).
    /// </summary>
    public string RefreshToken { get; set; } = string.Empty;

    /// <summary>
    /// Manager / MCC Account ID (format: "5929594590" without dashes).
    /// Required when calling on behalf of client accounts under the manager account.
    /// </summary>
    public string LoginCustomerId { get; set; } = "5929594590";

    /// <summary>
    /// Default operating Customer ID (format: "5929594590" without dashes).
    /// </summary>
    public string CustomerId { get; set; } = "5929594590";

    /// <summary>
    /// Google Ads API version (e.g. "v19").
    /// </summary>
    public string ApiVersion { get; set; } = "v19";

    /// <summary>
    /// Developer Token placeholder header (ignored by Google since Sept 9, 2026).
    /// </summary>
    public string DeveloperToken { get; set; } = "ignored";

    /// <summary>
    /// Base URL for Google Ads API endpoint.
    /// </summary>
    public string BaseUrl { get; set; } = "https://googleads.googleapis.com";

    /// <summary>
    /// OAuth 2.0 Token Endpoint URL.
    /// </summary>
    public string TokenUrl { get; set; } = "https://oauth2.googleapis.com/token";

    /// <summary>
    /// Formats customer ID to remove any dashes.
    /// </summary>
    public static string FormatCustomerId(string? customerId)
    {
        if (string.IsNullOrWhiteSpace(customerId)) return string.Empty;
        return customerId.Replace("-", "").Trim();
    }
}
