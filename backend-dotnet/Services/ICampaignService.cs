using LeadGrowth.Models;

namespace LeadGrowth.Services;

public interface ICampaignService
{
    Task<List<Campaign>> GetCampaignsAsync(string email);
    Task<List<Dictionary<string, object>>> GetUserCampaignsAsync(string email);
    Task<Campaign> CreateCampaignAsync(Campaign campaign, string email);
}
