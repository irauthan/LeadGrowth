using LeadGrowth.Data;
using LeadGrowth.DTOs;
using Microsoft.EntityFrameworkCore;

namespace LeadGrowth.Services;

public class DashboardService : IDashboardService
{
    private readonly LeadGrowthDbContext _context;
    private readonly ILeadService _leadService;

    public DashboardService(LeadGrowthDbContext context, ILeadService leadService)
    {
        _context = context;
        _leadService = leadService;
    }

    public async Task<DashboardKpis> GetDashboardDataAsync(string email, string? period, string? startDate, string? endDate)
    {
        var userEmail = email.Trim().ToLower();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == userEmail);
        if (user == null || user.WorkspaceId == null)
        {
            throw new KeyNotFoundException("User workspace not found");
        }

        var leads = await _leadService.GetLeadsAsync(email);
        var campaigns = await _context.Campaigns.Where(c => c.WorkspaceId == user.WorkspaceId).ToListAsync();
        var users = await _context.Users.Where(u => u.WorkspaceId == user.WorkspaceId && !string.Equals("SUSPENDED", u.Status)).ToListAsync();

        var totalLeads = leads.Count;
        var converted = leads.Count(l => string.Equals("Converted", l.Status, StringComparison.OrdinalIgnoreCase) || string.Equals("Closed Won", l.Status, StringComparison.OrdinalIgnoreCase));
        var conversionRate = totalLeads > 0 ? (double)converted / totalLeads * 100 : 0.0;

        var leadProposalTotal = leads
            .Where(l => l.ProposalAmount.HasValue && l.ProposalAmount.Value > 0)
            .Sum(l => (decimal)l.ProposalAmount.Value);

        var revenue = campaigns.Sum(c => c.Revenue) + leadProposalTotal;
        var spend = campaigns.Sum(c => c.Spend);
        var budget = campaigns.Sum(c => c.Budget);
        var clicks = campaigns.Sum(c => c.Clicks);
        var impressions = campaigns.Sum(c => c.Impressions);
        var conversions = campaigns.Sum(c => c.Conversions);
        var activeCampaigns = campaigns.Count(c => string.Equals("ACTIVE", c.Status, StringComparison.OrdinalIgnoreCase));

        var roas = spend > 0 ? Math.Round((double)(revenue / spend), 2) : (revenue > 0 ? (double)revenue : 0.0);
        var cpc = clicks > 0 ? Math.Round((double)(spend / clicks), 2) : 0.0;
        var ctr = impressions > 0 ? Math.Round((double)clicks / impressions * 100, 2) : 0.0;

        var funnel = new Dictionary<string, int>
        {
            { "New", leads.Count(l => string.Equals("New", l.Status, StringComparison.OrdinalIgnoreCase)) },
            { "Interaction", leads.Count(l => string.Equals("Interaction", l.Status, StringComparison.OrdinalIgnoreCase)) },
            { "Qualified", leads.Count(l => string.Equals("Qualified", l.Status, StringComparison.OrdinalIgnoreCase)) },
            { "Proposal Sent", leads.Count(l => string.Equals("Proposal Sent", l.Status, StringComparison.OrdinalIgnoreCase)) },
            { "Negotiation", leads.Count(l => string.Equals("Negotiation", l.Status, StringComparison.OrdinalIgnoreCase)) },
            { "Converted", converted },
            { "Lost", leads.Count(l => string.Equals("Lost", l.Status, StringComparison.OrdinalIgnoreCase) || string.Equals("Rejected", l.Status, StringComparison.OrdinalIgnoreCase)) }
        };

        var trends = new List<Dictionary<string, object>>();
        var now = DateTime.UtcNow;
        for (int i = 6; i >= 0; i--)
        {
            var date = now.AddDays(-i).ToString("MMM dd");
            trends.Add(new Dictionary<string, object>
            {
                { "date", date },
                { "revenue", Math.Round((double)revenue / 7 * (7 - i), 2) },
                { "spend", Math.Round((double)spend / 7 * (7 - i), 2) }
            });
        }

        return new DashboardKpis
        {
            TotalLeads = totalLeads,
            ConvertedLeads = converted,
            TotalConversions = conversions > 0 ? conversions : converted,
            ConversionRate = Math.Round(conversionRate, 1),
            TotalRevenue = revenue,
            TotalSpend = spend,
            ActiveBudget = budget,
            Roas = roas,
            Cpc = cpc,
            Ctr = ctr,
            ActiveCampaigns = activeCampaigns,
            ActiveUsers = users.Count,
            RecentLeads = leads.Take(10).ToList(),
            Funnel = funnel,
            Trends = trends
        };
    }

    public async Task<List<SearchResultDto>> SearchGlobalAsync(string query, string email)
    {
        var userEmail = email.Trim().ToLower();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == userEmail);
        if (user == null || user.WorkspaceId == null || string.IsNullOrWhiteSpace(query))
        {
            return new List<SearchResultDto>();
        }

        var q = query.Trim().ToLower();
        var results = new List<SearchResultDto>();

        var leads = await _context.Leads
            .Where(l => l.WorkspaceId == user.WorkspaceId && (l.Name.ToLower().Contains(q) || l.Email.ToLower().Contains(q) || (l.Phone != null && l.Phone.Contains(q))))
            .Take(5)
            .ToListAsync();

        foreach (var l in leads)
        {
            results.Add(new SearchResultDto
            {
                Id = l.Id,
                Type = "LEAD",
                Title = l.Name,
                Subtitle = $"Lead ({l.Status ?? "New"}) - {l.Email}",
                Url = $"/leads?id={l.Id}"
            });
        }

        var tasks = await _context.Tasks
            .Where(t => t.WorkspaceId == user.WorkspaceId && t.Title.ToLower().Contains(q))
            .Take(5)
            .ToListAsync();

        foreach (var t in tasks)
        {
            results.Add(new SearchResultDto
            {
                Id = t.Id,
                Type = "TASK",
                Title = t.Title,
                Subtitle = $"Task ({t.Status ?? "Pending"}) - Priority: {t.Priority ?? "Medium"}",
                Url = $"/tasks?id={t.Id}"
            });
        }

        var campaigns = await _context.Campaigns
            .Where(c => c.WorkspaceId == user.WorkspaceId && c.Name.ToLower().Contains(q))
            .Take(5)
            .ToListAsync();

        foreach (var c in campaigns)
        {
            results.Add(new SearchResultDto
            {
                Id = c.Id,
                Type = "CAMPAIGN",
                Title = c.Name,
                Subtitle = $"Campaign ({c.Platform}) - {c.LeadsCount} Leads",
                Url = $"/campaigns?id={c.Id}"
            });
        }

        return results;
    }
}
