using LeadGrowth.Data;
using LeadGrowth.Models;
using Microsoft.EntityFrameworkCore;

namespace LeadGrowth.Services;

public class CampaignService : ICampaignService
{
    private readonly LeadGrowthDbContext _context;

    public CampaignService(LeadGrowthDbContext context)
    {
        _context = context;
    }

    public async Task<List<Campaign>> GetCampaignsAsync(string email)
    {
        var userEmail = email.Trim().ToLower();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == userEmail);
        if (user == null || user.WorkspaceId == null)
        {
            throw new KeyNotFoundException("User workspace not found");
        }

        return await _context.Campaigns
            .Where(c => c.WorkspaceId == user.WorkspaceId)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<Dictionary<string, object>>> GetUserCampaignsAsync(string email)
    {
        var campaigns = await GetCampaignsAsync(email);
        return campaigns.Select(c => new Dictionary<string, object>
        {
            { "id", c.Id },
            { "name", c.Name },
            { "platform", c.Platform },
            { "status", c.Status ?? "ACTIVE" },
            { "budget", c.Budget },
            { "spend", c.Spend },
            { "leadsCount", c.LeadsCount },
            { "conversions", c.Conversions },
            { "revenue", c.Revenue },
            { "createdAt", c.CreatedAt.ToString("o") }
        }).ToList();
    }

    public async Task<Campaign> CreateCampaignAsync(Campaign campaign, string email)
    {
        var userEmail = email.Trim().ToLower();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == userEmail);
        if (user == null || user.WorkspaceId == null)
        {
            throw new KeyNotFoundException("User workspace not found");
        }

        campaign.WorkspaceId = user.WorkspaceId.Value;
        campaign.CreatedAt = DateTime.UtcNow;
        if (campaign.Status == null) campaign.Status = "ACTIVE";

        _context.Campaigns.Add(campaign);
        await _context.SaveChangesAsync();

        return campaign;
    }
}
