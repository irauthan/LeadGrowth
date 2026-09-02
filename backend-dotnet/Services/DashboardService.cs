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
        var user = await _context.Users
            .Include(u => u.Roles)
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Email == userEmail);

        if (user == null || user.WorkspaceId == null)
        {
            throw new KeyNotFoundException("User workspace not found");
        }

        var (rangeStart, rangeEnd) = DateRangeHelper.ParsePeriodRange(period, startDate, endDate);
        var isFiltered = !string.IsNullOrWhiteSpace(period) && !"all".Equals(period, StringComparison.OrdinalIgnoreCase);
        bool isUserOnly = user.Roles.All(r => !r.Name.Contains("ADMIN", StringComparison.OrdinalIgnoreCase) && !r.Name.Contains("MANAGER", StringComparison.OrdinalIgnoreCase));

        // 1. Optimized Lead Query with AsNoTracking (fetching only fields needed for aggregates, funnel & trends)
        var leadsQuery = _context.Leads.AsNoTracking()
            .Where(l => isUserOnly ? l.AssignedToId == user.Id : l.WorkspaceId == user.WorkspaceId);

        var allLeadsData = await leadsQuery
            .Select(l => new {
                l.Id,
                l.Status,
                l.ProposalAmount,
                l.CreatedAt
            })
            .ToListAsync();

        var filteredLeadsData = isFiltered
            ? allLeadsData.Where(l => l.CreatedAt >= rangeStart && l.CreatedAt <= rangeEnd).ToList()
            : allLeadsData;

        var totalLeads = filteredLeadsData.Count;
        var converted = filteredLeadsData.Count(l => 
            string.Equals("Converted", l.Status, StringComparison.OrdinalIgnoreCase) || 
            string.Equals("Closed Won", l.Status, StringComparison.OrdinalIgnoreCase));
        var conversionRate = totalLeads > 0 ? (double)converted / totalLeads * 100 : 0.0;

        var leadProposalTotal = filteredLeadsData
            .Where(l => l.ProposalAmount.HasValue && l.ProposalAmount.Value > 0)
            .Sum(l => (decimal)(l.ProposalAmount ?? 0));

        // 2. Campaigns query (single fast query)
        var campaignsQuery = _context.Campaigns.AsNoTracking()
            .Where(c => c.WorkspaceId == user.WorkspaceId);

        var allCampaigns = await campaignsQuery.ToListAsync();

        var campaigns = isFiltered
            ? allCampaigns.Where(c => c.CreatedAt >= rangeStart && c.CreatedAt <= rangeEnd).ToList()
            : allCampaigns;

        var revenue = campaigns.Sum(c => c.Revenue) + leadProposalTotal;
        var spend = campaigns.Sum(c => c.Spend);
        var budget = campaigns.Sum(c => c.Budget);
        var clicks = campaigns.Sum(c => c.Clicks);
        var impressions = campaigns.Sum(c => c.Impressions);
        var conversions = campaigns.Sum(c => c.Conversions) + converted;
        var activeCampaigns = allCampaigns.Count(c => string.Equals("ACTIVE", c.Status, StringComparison.OrdinalIgnoreCase));

        var roas = spend > 0 ? Math.Round((double)(revenue / spend), 2) : (revenue > 0 ? (double)revenue : 0.0);
        var cpc = clicks > 0 ? Math.Round((double)(spend / clicks), 2) : 0.0;
        var ctr = impressions > 0 ? Math.Round((double)clicks / impressions * 100, 2) : 0.0;

        // 3. Funnel counts (in memory from filteredLeadsData)
        var funnel = new Dictionary<string, int>
        {
            { "New", filteredLeadsData.Count(l => string.Equals("New", l.Status, StringComparison.OrdinalIgnoreCase)) },
            { "Interaction", filteredLeadsData.Count(l => string.Equals("Interaction", l.Status, StringComparison.OrdinalIgnoreCase)) },
            { "Qualified", filteredLeadsData.Count(l => string.Equals("Qualified", l.Status, StringComparison.OrdinalIgnoreCase)) },
            { "Proposal Sent", filteredLeadsData.Count(l => string.Equals("Proposal Sent", l.Status, StringComparison.OrdinalIgnoreCase)) },
            { "Negotiation", filteredLeadsData.Count(l => string.Equals("Negotiation", l.Status, StringComparison.OrdinalIgnoreCase)) },
            { "Converted", converted },
            { "Lost", filteredLeadsData.Count(l => string.Equals("Lost", l.Status, StringComparison.OrdinalIgnoreCase) || string.Equals("Rejected", l.Status, StringComparison.OrdinalIgnoreCase)) }
        };

        // 4. Trends (in memory from allLeadsData and allCampaigns)
        var trends = new List<Dictionary<string, object>>();
        var now = DateTime.UtcNow;
        for (int i = 6; i >= 0; i--)
        {
            var targetDay = now.AddDays(-i).Date;
            var targetDayEnd = targetDay.AddDays(1).AddTicks(-1);
            var dayLeads = allLeadsData.Where(l => l.CreatedAt >= targetDay && l.CreatedAt <= targetDayEnd).ToList();
            var dayRevenue = dayLeads.Where(l => l.ProposalAmount.HasValue && l.ProposalAmount.Value > 0).Sum(l => (double)(l.ProposalAmount ?? 0));
            var dayCampaigns = allCampaigns.Where(c => c.CreatedAt >= targetDay && c.CreatedAt <= targetDayEnd).ToList();
            dayRevenue += dayCampaigns.Sum(c => (double)c.Revenue);
            var daySpend = dayCampaigns.Sum(c => (double)c.Spend);

            trends.Add(new Dictionary<string, object>
            {
                { "date", targetDay.ToString("MMM dd") },
                { "revenue", Math.Round(dayRevenue, 2) },
                { "spend", Math.Round(daySpend, 2) },
                { "leads", dayLeads.Count }
            });
        }

        // 5. Active Users count (fast count)
        var activeUsersCount = await _context.Users.AsNoTracking()
            .Where(u => u.WorkspaceId == user.WorkspaceId && u.Status != "SUSPENDED")
            .CountAsync();

        // 6. Recent 10 Leads ONLY (filtered by period if specified)
        var recentQuery = isFiltered
            ? leadsQuery.Where(l => l.CreatedAt >= rangeStart && l.CreatedAt <= rangeEnd)
            : leadsQuery;

        var recentLeadsRaw = await recentQuery
            .Include(l => l.AssignedTo)
            .Include(l => l.AssignedBy)
            .OrderByDescending(l => l.CreatedAt)
            .Take(10)
            .ToListAsync();

        var recentLeadDtos = new List<LeadDto>();
        if (recentLeadsRaw.Count > 0)
        {
            var workspaceFollowups = await _context.FollowupReminders.AsNoTracking()
                .Where(f => f.WorkspaceId == user.WorkspaceId)
                .OrderByDescending(f => f.ScheduledAt)
                .ToListAsync();

            var recentLeadIdsSet = new HashSet<long>(recentLeadsRaw.Select(l => l.Id));
            var followupsMap = workspaceFollowups
                .Where(f => recentLeadIdsSet.Contains(f.LeadId))
                .GroupBy(f => f.LeadId)
                .ToDictionary(g => g.Key, g => g.FirstOrDefault());

            foreach (var l in recentLeadsRaw)
            {
                followupsMap.TryGetValue(l.Id, out var f);
                recentLeadDtos.Add(new LeadDto
                {
                    Id = l.Id,
                    WorkspaceId = l.WorkspaceId,
                    CampaignId = l.CampaignId,
                    Name = l.Name,
                    Email = l.Email,
                    Phone = l.Phone,
                    SourcePlatform = l.SourcePlatform,
                    CampaignName = l.CampaignName,
                    Status = l.Status,
                    AssignedToId = l.AssignedToId,
                    AssignedToName = l.AssignedTo?.FullName ?? "Unassigned",
                    AssignedById = l.AssignedById,
                    AssignedByName = l.AssignedBy?.FullName ?? "System Queue",
                    AssignedDate = l.AssignedDate ?? l.CreatedAt,
                    QualityScore = l.QualityScore ?? 75,
                    QualityTier = l.QualityTier ?? "WARM",
                    ConversionProbability = l.ConversionProbability ?? 75.0,
                    QueueStatus = l.QueueStatus ?? (l.AssignedToId.HasValue ? "ASSIGNED" : "IN_QUEUE"),
                    Company = l.Company ?? "N/A",
                    Location = l.Location ?? "Remote / Unspecified",
                    Priority = l.Priority ?? "MEDIUM",
                    ProgressPercentage = l.ProgressPercentage ?? 0,
                    LastFollowupDate = l.LastFollowupDate,
                    DueDate = l.DueDate,
                    ClientNotes = l.ClientNotes,
                    ProposalAmount = l.ProposalAmount,
                    ProposalStatus = l.ProposalStatus,
                    CreatedAt = l.CreatedAt,
                    NextFollowupDate = f?.ScheduledAt,
                    FollowupNotes = f?.Notes,
                    FollowupType = f?.Type ?? "CALL",
                    FollowupStatus = f?.Status ?? "UPCOMING"
                });
            }
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
            ActiveUsers = activeUsersCount,
            RecentLeads = recentLeadDtos,
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

        // 1. Leads (search by Name, Email, Phone, Company, Status)
        var leads = await _context.Leads
            .Where(l => l.WorkspaceId == user.WorkspaceId && (
                l.Name.ToLower().Contains(q) || 
                l.Email.ToLower().Contains(q) || 
                (l.Phone != null && l.Phone.Contains(q)) ||
                (l.Company != null && l.Company.ToLower().Contains(q)) ||
                (l.Status != null && l.Status.ToLower().Contains(q))
            ))
            .Take(8)
            .ToListAsync();

        foreach (var l in leads)
        {
            results.Add(new SearchResultDto
            {
                Id = l.Id,
                Type = "LEAD",
                Title = l.Name,
                Subtitle = $"Lead ({l.Status ?? "New"}) • {l.Phone ?? l.Email ?? l.Company ?? "Direct"}",
                Url = $"/leads?id={l.Id}"
            });
        }

        // 2. Team Members / Users
        var users = await _context.Users
            .Where(u => u.WorkspaceId == user.WorkspaceId && (
                u.FullName.ToLower().Contains(q) || 
                u.Email.ToLower().Contains(q) || 
                (u.Designation != null && u.Designation.ToLower().Contains(q)) ||
                (u.Department != null && u.Department.ToLower().Contains(q))
            ))
            .Take(5)
            .ToListAsync();

        foreach (var u in users)
        {
            results.Add(new SearchResultDto
            {
                Id = u.Id,
                Type = "USER",
                Title = u.FullName,
                Subtitle = $"{u.Designation ?? "Team Member"} • {u.Department ?? u.Email}",
                Url = $"/admin/work-monitor?userId={u.Id}"
            });
        }

        // 3. Campaigns
        var campaigns = await _context.Campaigns
            .Where(c => c.WorkspaceId == user.WorkspaceId && (
                c.Name.ToLower().Contains(q) ||
                (c.Platform != null && c.Platform.ToLower().Contains(q))
            ))
            .Take(5)
            .ToListAsync();

        foreach (var c in campaigns)
        {
            results.Add(new SearchResultDto
            {
                Id = c.Id,
                Type = "CAMPAIGN",
                Title = c.Name,
                Subtitle = $"Campaign ({c.Platform}) • Budget: ₹{c.Budget:N0} • {c.LeadsCount} Leads",
                Url = $"/campaigns?id={c.Id}&search={Uri.EscapeDataString(c.Name)}"
            });
        }

        // 4. Tasks
        var tasks = await _context.Tasks
            .Where(t => t.WorkspaceId == user.WorkspaceId && (
                t.Title.ToLower().Contains(q) ||
                (t.Description != null && t.Description.ToLower().Contains(q))
            ))
            .Take(5)
            .ToListAsync();

        foreach (var t in tasks)
        {
            results.Add(new SearchResultDto
            {
                Id = t.Id,
                Type = "TASK",
                Title = t.Title,
                Subtitle = $"Task ({t.Status ?? "Pending"}) • Priority: {t.Priority ?? "Medium"}",
                Url = $"/my-work"
            });
        }

        // 5. Followup Reminders
        var followups = await _context.FollowupReminders
            .Include(f => f.Lead)
            .Where(f => f.WorkspaceId == user.WorkspaceId && (
                (f.Notes != null && f.Notes.ToLower().Contains(q)) ||
                (f.Remarks != null && f.Remarks.ToLower().Contains(q)) ||
                (f.Lead != null && f.Lead.Name.ToLower().Contains(q))
            ))
            .Take(5)
            .ToListAsync();

        foreach (var f in followups)
        {
            results.Add(new SearchResultDto
            {
                Id = f.Id,
                Type = "FOLLOWUP",
                Title = $"{f.Type}: {f.Lead?.Name ?? "Lead Follow-up"}",
                Subtitle = $"Scheduled: {f.ScheduledAt:dd MMM hh:mm tt} • Status: {f.Status}",
                Url = $"/followups?id={f.Id}&leadId={f.LeadId}"
            });
        }

        // 6. Calendar Events
        var events = await _context.CalendarEvents
            .Where(e => e.WorkspaceId == user.WorkspaceId && (
                e.Title.ToLower().Contains(q) ||
                (e.Description != null && e.Description.ToLower().Contains(q)) ||
                (e.EventType != null && e.EventType.ToLower().Contains(q))
            ))
            .Take(5)
            .ToListAsync();

        foreach (var e in events)
        {
            results.Add(new SearchResultDto
            {
                Id = e.Id,
                Type = "EVENT",
                Title = e.Title,
                Subtitle = $"Meeting/Event ({e.EventType ?? "General"}) • {e.StartTime:dd MMM hh:mm tt}",
                Url = $"/scheduler?eventId={e.Id}"
            });
        }

        // 7. Navigation Pages & System Modules (Quick Shortcuts)
        var systemPages = new List<(string Name, string Category, string Description, string Path)>
        {
            ("Lead Management Console", "Leads", "View and manage all active leads, stages and assignments", "/leads"),
            ("Priority Center", "Pipeline", "AI prioritized lead queues and hot action items", "/priority-center"),
            ("My Work (Kanban & Table)", "Tasks", "Personal pipeline board, lead stages and tasks", "/my-work"),
            ("Executive Work Monitor", "Admin", "Real-time employee activity tracking, call logs and audit history", "/admin/work-monitor"),
            ("Calendar & Meeting Scheduler", "Schedule", "Schedule meetings, Google Calendar sync and calls", "/scheduler"),
            ("Campaigns & Ad Analytics", "Marketing", "Meta & Google Ads campaigns, budget spend and ROI", "/campaigns"),
            ("Scheduled Follow-ups", "Outreach", "Upcoming, overdue and completed scheduled follow-ups", "/followups"),
            ("Analytics & Conversion Performance", "Analytics", "Pipeline funnel, ROI, velocity and conversion stats", "/analytics"),
            ("Executive Reports", "Reports", "Comprehensive downloadable CSV and Excel intelligence reports", "/reports"),
            ("Team & User Management", "Admin", "Manage members, designations, roles and permissions", "/admin/users"),
            ("Security & Real-time Audit Trail", "Security", "Security logs, login sessions, and workspace audit trail", "/admin/audit-logs"),
            ("Integrations & Webhooks", "Integrations", "Connect Meta Lead Ads, Google Ads, Zapier and webhooks", "/integrations"),
            ("Billing & Subscription", "Billing", "Manage subscription plans, invoices and payment details", "/billing"),
            ("Workspace Settings", "Settings", "Configure company profile, branding, domains and alerts", "/settings"),
            ("Activity Logs Stream", "Audit", "Live chronological log of all interactions and changes", "/activity-logs"),
            ("Notification Center", "Notifications", "System alerts, lead notifications and reassignment updates", "/notifications-page")
        };

        var matchedPages = systemPages
            .Where(p => p.Name.ToLower().Contains(q) || p.Category.ToLower().Contains(q) || p.Description.ToLower().Contains(q) || p.Path.ToLower().Contains(q))
            .Take(4);

        foreach (var p in matchedPages)
        {
            results.Add(new SearchResultDto
            {
                Id = 0,
                Type = "PAGE",
                Title = p.Name,
                Subtitle = $"{p.Category} • {p.Description}",
                Url = p.Path
            });
        }

        return results;
    }
}
