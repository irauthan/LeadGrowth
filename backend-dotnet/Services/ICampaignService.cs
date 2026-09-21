using LeadGrowth.DTOs;
using LeadGrowth.Models;

namespace LeadGrowth.Services;

public interface ICampaignService
{
    Task<List<Campaign>> GetCampaignsAsync(string email, string? period = null, string? startDate = null, string? endDate = null);
    Task<List<Dictionary<string, object>>> GetUserCampaignsAsync(string email);
    Task<object?> GetCampaignDetailsAsync(long id, string email);
    Task<PlatformCampaignResultDto> CreatePlatformCampaignAsync(CreatePlatformCampaignDto dto, string email);
    Task<Campaign> UpdateCampaignAsync(long id, Campaign updated, string email);
    Task<Campaign> UpdateCampaignStatusAsync(long id, string status, string email);
    Task<Campaign> UpdateCampaignBudgetAsync(long id, decimal budget, string email);
    Task<bool> DeleteCampaignAsync(long id, string email);
    Task<CampaignSyncStatusDto> GetSyncStatusAsync(string email);
    Task<List<AdAccountInfoDto>> GetConnectedAdAccountsAsync(string email, string? platform = null);
    Task<CampaignSyncStatusDto> SyncWorkspaceCampaignsAsync(string email, string? platform = null);
}

