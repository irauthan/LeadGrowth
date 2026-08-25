using LeadGrowth.Models;

namespace LeadGrowth.Services;

public interface ICampaignService
{
    Task<List<Campaign>> GetCampaignsAsync(string email, string? period = null, string? startDate = null, string? endDate = null);
    Task<List<Dictionary<string, object>>> GetUserCampaignsAsync(string email);
    Task<object?> GetCampaignDetailsAsync(long id, string email);
    Task<Campaign> CreateCampaignAsync(Campaign campaign, string email);
    Task<Campaign> UpdateCampaignAsync(long id, Campaign updated, string email);
    Task<Campaign> UpdateCampaignStatusAsync(long id, string status, string email);
    Task<bool> DeleteCampaignAsync(long id, string email);
}
