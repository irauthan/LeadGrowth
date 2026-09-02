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

    public async Task<List<Campaign>> GetCampaignsAsync(string email, string? period = null, string? startDate = null, string? endDate = null)
    {
        var userEmail = email.Trim().ToLower();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == userEmail);
        if (user == null || user.WorkspaceId == null)
        {
            throw new KeyNotFoundException("User workspace not found");
        }

        var (rangeStart, rangeEnd) = DateRangeHelper.ParsePeriodRange(period, startDate, endDate);
        var isFiltered = !string.IsNullOrWhiteSpace(period) && !"all".Equals(period, StringComparison.OrdinalIgnoreCase);

        var query = _context.Campaigns.Where(c => c.WorkspaceId == user.WorkspaceId);

        if (isFiltered)
        {
            query = query.Where(c => c.CreatedAt >= rangeStart && c.CreatedAt <= rangeEnd);
        }

        return await query
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<Dictionary<string, object>>> GetUserCampaignsAsync(string email)
    {
        var userEmail = email.Trim().ToLower();
        var user = await _context.Users
            .Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.Email == userEmail);

        if (user == null || user.WorkspaceId == null)
        {
            throw new KeyNotFoundException("User workspace not found");
        }

        var campaigns = await GetCampaignsAsync(email);
        var isAdminOrManager = user.Roles.Any(r => 
            r.Name.ToUpper().Contains("ADMIN") || 
            r.Name.ToUpper().Contains("MANAGER")
        );

        if (isAdminOrManager)
        {
            return campaigns.Select(c => new Dictionary<string, object>
            {
                { "id", c.Id },
                { "name", c.Name },
                { "platform", c.Platform },
                { "status", c.Status ?? "ACTIVE" },
                { "budget", c.Budget },
                { "spend", c.Spend },
                { "clicks", c.Clicks },
                { "impressions", c.Impressions },
                { "leadsCount", c.LeadsCount },
                { "conversions", c.Conversions },
                { "revenue", c.Revenue },
                { "createdAt", c.CreatedAt.ToString("o") }
            }).ToList();
        }

        // For regular user: Calculate personal revenue & conversions from user's assigned leads
        var userLeads = await _context.Leads
            .Where(l => l.WorkspaceId == user.WorkspaceId && l.AssignedToId == user.Id)
            .ToListAsync();

        return campaigns.Select(c =>
        {
            var myLeads = userLeads.Where(l => 
                l.CampaignId == c.Id || 
                (l.CampaignName != null && l.CampaignName.Equals(c.Name, StringComparison.OrdinalIgnoreCase))
            ).ToList();

            var myConverted = myLeads.Where(l => 
                l.Status != null && (
                    l.Status.Equals("CONVERTED", StringComparison.OrdinalIgnoreCase) ||
                    l.Status.Equals("Closed Won", StringComparison.OrdinalIgnoreCase) ||
                    l.Status.Equals("Closed_Won", StringComparison.OrdinalIgnoreCase) ||
                    l.Status.Equals("Won", StringComparison.OrdinalIgnoreCase) ||
                    l.Status.Equals("Payment Completed", StringComparison.OrdinalIgnoreCase) ||
                    l.Status.Equals("Payment_Completed", StringComparison.OrdinalIgnoreCase)
                )
            ).ToList();

            var myRevenue = (decimal)myConverted.Sum(l => l.ProposalAmount ?? 0.0);
            var myConversions = myConverted.Count;
            var myLeadsCount = myLeads.Count;

            return new Dictionary<string, object>
            {
                { "id", c.Id },
                { "name", c.Name },
                { "platform", c.Platform },
                { "status", c.Status ?? "ACTIVE" },
                { "budget", 0m },
                { "spend", 0m },
                { "clicks", c.Clicks },
                { "impressions", c.Impressions },
                { "leadsCount", myLeadsCount },
                { "conversions", myConversions },
                { "revenue", myRevenue },
                { "createdAt", c.CreatedAt.ToString("o") }
            };
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

    public async Task<object?> GetCampaignDetailsAsync(long id, string email)
    {
        var userEmail = email.Trim().ToLower();
        var user = await _context.Users
            .Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.Email == userEmail);

        if (user == null || user.WorkspaceId == null)
        {
            throw new KeyNotFoundException("User workspace not found");
        }

        var campaign = await _context.Campaigns
            .FirstOrDefaultAsync(c => c.Id == id && c.WorkspaceId == user.WorkspaceId);

        if (campaign == null)
        {
            return null;
        }

        var isAdminOrManager = user.Roles.Any(r => 
            r.Name.ToUpper().Contains("ADMIN") || 
            r.Name.ToUpper().Contains("MANAGER")
        );

        // Fetch leads tied to this campaign (by CampaignId or matching CampaignName)
        var leadsQuery = _context.Leads
            .Include(l => l.AssignedTo)
            .Where(l => l.WorkspaceId == user.WorkspaceId && (l.CampaignId == id || (l.CampaignName != null && l.CampaignName == campaign.Name)));

        if (!isAdminOrManager)
        {
            leadsQuery = leadsQuery.Where(l => l.AssignedToId == user.Id);
        }

        var leads = await leadsQuery
            .OrderByDescending(l => l.CreatedAt)
            .Take(50)
            .Select(l => new
            {
                id = l.Id,
                name = l.Name,
                email = l.Email,
                phone = l.Phone,
                status = l.Status,
                dealValue = l.ProposalAmount,
                sourcePlatform = l.SourcePlatform,
                assignedToName = l.AssignedTo != null ? l.AssignedTo.FullName : null,
                createdAt = l.CreatedAt.ToString("o")
            })
            .ToListAsync();

        var ctr = campaign.Impressions > 0 ? ((decimal)campaign.Clicks / campaign.Impressions) * 100m : 0m;
        var cpc = campaign.Clicks > 0 ? (campaign.Spend / campaign.Clicks) : 0m;
        var cpa = campaign.Conversions > 0 ? (campaign.Spend / campaign.Conversions) : 0m;
        var roas = campaign.Spend > 0 ? (campaign.Revenue / campaign.Spend) : 0m;
        var conversionRate = campaign.Clicks > 0 ? ((decimal)campaign.Conversions / campaign.Clicks) * 100m : 0m;
        var leadConversionRate = campaign.LeadsCount > 0 ? ((decimal)campaign.Conversions / campaign.LeadsCount) * 100m : 0m;
        var profit = campaign.Revenue - campaign.Spend;
        var budgetUsedPercent = campaign.Budget > 0 ? (campaign.Spend / campaign.Budget) * 100m : 0m;

        return new
        {
            campaign = new
            {
                id = campaign.Id,
                name = campaign.Name,
                platform = campaign.Platform,
                status = campaign.Status ?? "ACTIVE",
                budget = campaign.Budget,
                spend = campaign.Spend,
                clicks = campaign.Clicks,
                impressions = campaign.Impressions,
                leadsCount = Math.Max(campaign.LeadsCount, leads.Count),
                conversions = campaign.Conversions,
                revenue = campaign.Revenue,
                createdAt = campaign.CreatedAt.ToString("o")
            },
            metrics = new
            {
                ctr = Math.Round(ctr, 2),
                cpc = Math.Round(cpc, 2),
                cpa = Math.Round(cpa, 2),
                roas = Math.Round(roas, 2),
                conversionRate = Math.Round(conversionRate, 2),
                leadConversionRate = Math.Round(leadConversionRate, 2),
                profit = Math.Round(profit, 2),
                budgetUsedPercent = Math.Round(budgetUsedPercent, 1)
            },
            leads = leads
        };
    }

    public async Task<Campaign> UpdateCampaignAsync(long id, Campaign updated, string email)
    {
        var userEmail = email.Trim().ToLower();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == userEmail);
        if (user == null || user.WorkspaceId == null)
        {
            throw new KeyNotFoundException("User workspace not found");
        }

        var campaign = await _context.Campaigns
            .FirstOrDefaultAsync(c => c.Id == id && c.WorkspaceId == user.WorkspaceId);

        if (campaign == null)
        {
            throw new KeyNotFoundException("Campaign not found");
        }

        campaign.Name = updated.Name ?? campaign.Name;
        campaign.Platform = updated.Platform ?? campaign.Platform;
        campaign.Status = updated.Status ?? campaign.Status;
        campaign.Budget = updated.Budget;
        campaign.Spend = updated.Spend;
        campaign.Clicks = updated.Clicks;
        campaign.Impressions = updated.Impressions;
        campaign.LeadsCount = updated.LeadsCount;
        campaign.Conversions = updated.Conversions;
        campaign.Revenue = updated.Revenue;

        await _context.SaveChangesAsync();
        return campaign;
    }

    public async Task<Campaign> UpdateCampaignStatusAsync(long id, string status, string email)
    {
        var userEmail = email.Trim().ToLower();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == userEmail);
        if (user == null || user.WorkspaceId == null)
        {
            throw new KeyNotFoundException("User workspace not found");
        }

        var campaign = await _context.Campaigns
            .FirstOrDefaultAsync(c => c.Id == id && c.WorkspaceId == user.WorkspaceId);

        if (campaign == null)
        {
            throw new KeyNotFoundException("Campaign not found");
        }

        campaign.Status = status;
        await _context.SaveChangesAsync();
        return campaign;
    }

    public async Task<bool> DeleteCampaignAsync(long id, string email)
    {
        var userEmail = email.Trim().ToLower();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == userEmail);
        if (user == null || user.WorkspaceId == null)
        {
            throw new KeyNotFoundException("User workspace not found");
        }

        var campaign = await _context.Campaigns
            .FirstOrDefaultAsync(c => c.Id == id && c.WorkspaceId == user.WorkspaceId);

        if (campaign == null)
        {
            return false;
        }

        // Dissociate leads
        var leads = await _context.Leads.Where(l => l.CampaignId == id).ToListAsync();
        foreach (var l in leads)
        {
            l.CampaignId = null;
        }

        _context.Campaigns.Remove(campaign);
        await _context.SaveChangesAsync();
        return true;
    }
}
