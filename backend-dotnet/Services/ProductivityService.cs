using LeadGrowth.Data;
using LeadGrowth.DTOs;
using LeadGrowth.Models;
using Microsoft.EntityFrameworkCore;

namespace LeadGrowth.Services;

public class ProductivityService : IProductivityService
{
    private readonly LeadGrowthDbContext _context;

    public ProductivityService(LeadGrowthDbContext context)
    {
        _context = context;
    }

    public async Task<List<TeamProductivityDto>> GetTeamProductivityAsync(string email)
    {
        var normalizedEmail = email.Trim().ToLower();
        var actor = await _context.Users
            .Include(u => u.Workspace)
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);

        if (actor == null)
        {
            actor = await _context.Users
                .Include(u => u.Workspace)
                .AsNoTracking()
                .FirstOrDefaultAsync();
        }

        if (actor == null)
        {
            throw new KeyNotFoundException("User not found");
        }

        if (actor.WorkspaceId == null)
        {
            throw new InvalidOperationException("User is not associated with a workspace");
        }

        var members = await _context.Users
            .AsNoTracking()
            .Where(u => u.WorkspaceId == actor.WorkspaceId)
            .ToListAsync();

        var wsId = actor.WorkspaceId.Value;

        // Batch load workspace tasks, leads, activity logs, calls, followups
        var allTasks = await _context.Tasks.AsNoTracking()
            .Where(t => t.WorkspaceId == wsId && t.AssignedToId.HasValue)
            .Select(t => new { t.AssignedToId, t.Status })
            .ToListAsync();

        var allLeads = await _context.Leads.AsNoTracking()
            .Where(l => l.WorkspaceId == wsId && l.AssignedToId.HasValue)
            .Select(l => new { l.AssignedToId, l.Status, Progress = l.ProgressPercentage ?? 0 })
            .ToListAsync();

        var allActivityLogs = await _context.SalesActivityLogs.AsNoTracking()
            .Where(a => a.Lead != null && a.Lead.WorkspaceId == wsId && a.LoggedById.HasValue)
            .Select(a => a.LoggedById!.Value)
            .ToListAsync();

        var allCalls = await _context.CallHistories.AsNoTracking()
            .Where(c => c.WorkspaceId == wsId)
            .Select(c => c.UserId)
            .ToListAsync();

        var allFollowups = await _context.FollowupReminders.AsNoTracking()
            .Where(f => f.WorkspaceId == wsId && f.AssignedToId.HasValue && (f.Status == "COMPLETED" || f.Status == "Completed"))
            .Select(f => f.AssignedToId!.Value)
            .ToListAsync();

        var dtos = new List<TeamProductivityDto>();

        foreach (var user in members)
        {
            if (string.Equals("SUSPENDED", user.Status, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            var userTasks = allTasks.Where(t => t.AssignedToId == user.Id).ToList();
            var totalTasks = userTasks.Count;
            var completedTasks = userTasks.Count(t =>
                string.Equals(t.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(t.Status, "APPROVED", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(t.Status, "Completed", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(t.Status, "Approved", StringComparison.OrdinalIgnoreCase));

            var userLeads = allLeads.Where(l => l.AssignedToId == user.Id).ToList();
            var totalLeads = userLeads.Count;
            var completedLeads = userLeads.Count(l =>
                string.Equals(l.Status, "CONVERTED", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(l.Status, "WON", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(l.Status, "Converted", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(l.Status, "Won", StringComparison.OrdinalIgnoreCase));

            double conversionRate = totalLeads > 0 ? (double)completedLeads / totalLeads : 0.0;
            int leadProgressSum = userLeads.Sum(l => l.Progress);
            double avgLeadProgress = totalLeads > 0 ? (double)leadProgressSum / totalLeads : 0.0;

            int activitiesCount = allActivityLogs.Count(id => id == user.Id);
            int callsCount = allCalls.Count(id => id == user.Id);
            int completedFollowups = allFollowups.Count(id => id == user.Id);
            int totalOutreachEffort = activitiesCount + callsCount + completedFollowups;

            double avgResponseTime = 4.0;
            if (completedTasks + completedLeads + totalOutreachEffort > 0)
            {
                avgResponseTime = Math.Max(1.0, 4.0 - (0.05 * (completedTasks + completedLeads + totalOutreachEffort)));
            }

            double taskScore = totalTasks > 0 ? ((double)completedTasks / totalTasks) * 100.0 : 0.0;
            double leadScore = avgLeadProgress;
            double conversionScore = conversionRate * 100.0;
            double activityScore = Math.Min(100.0, totalOutreachEffort * 10.0);

            double score = 0.0;
            if (totalTasks > 0 && totalLeads > 0)
            {
                score = (taskScore * 0.30) + (leadScore * 0.30) + (conversionScore * 0.25) + (activityScore * 0.15);
            }
            else if (totalTasks > 0)
            {
                score = (taskScore * 0.70) + (activityScore * 0.30);
            }
            else if (totalLeads > 0)
            {
                score = (leadScore * 0.45) + (conversionScore * 0.35) + (activityScore * 0.20);
            }
            else if (totalOutreachEffort > 0)
            {
                score = Math.Min(95.0, 45.0 + (totalOutreachEffort * 7.5));
            }
            else
            {
                score = string.Equals("AVAILABLE", user.AvailabilityStatus, StringComparison.OrdinalIgnoreCase) ? 55.0 : 35.0;
            }

            score = Math.Round(score * 10.0) / 10.0;
            score = Math.Min(100.0, Math.Max(0.0, score));

            var category = "Needs Improvement";
            if (score >= 75.0) category = "Top Performer";
            else if (score >= 45.0) category = "Average Performer";

            dtos.Add(new TeamProductivityDto
            {
                UserId = user.Id,
                FullName = user.FullName,
                CompletedTasks = completedTasks,
                CompletedLeads = completedLeads,
                ConversionRate = conversionRate,
                AverageResponseTime = avgResponseTime,
                Score = score,
                Category = category
            });
        }

        return dtos;
    }

    public async Task GenerateDailyScorecardAsync()
    {
        var users = await _context.Users.Include(u => u.Workspace).ToListAsync();
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        foreach (var user in users)
        {
            if (user.WorkspaceId == null || string.Equals("SUSPENDED", user.Status, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            var dto = await CalculateUserProductivityDtoAsync(user);

            var record = await _context.UserProductivities
                .FirstOrDefaultAsync(p => p.WorkspaceId == user.WorkspaceId && p.UserId == user.Id && p.Date == today);

            if (record == null)
            {
                record = new UserProductivity
                {
                    WorkspaceId = user.WorkspaceId.Value,
                    UserId = user.Id,
                    Date = today
                };
                _context.UserProductivities.Add(record);
            }

            record.TasksCompleted = dto.CompletedTasks;
            record.LeadsConverted = dto.CompletedLeads;
            record.Score = (int)dto.Score;

            await _context.SaveChangesAsync();
        }
    }

    public async Task<TeamProductivityDto> CalculateUserProductivityDtoAsync(User u)
    {
        // 1. Tasks Metrics
        var userTasks = await _context.Tasks
            .Where(t => t.AssignedToId == u.Id)
            .ToListAsync();
        var totalTasks = userTasks.Count;
        var completedTasks = userTasks.Count(t =>
            string.Equals(t.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(t.Status, "APPROVED", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(t.Status, "Completed", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(t.Status, "Approved", StringComparison.OrdinalIgnoreCase));

        // 2. Leads Metrics
        var userLeads = await _context.Leads
            .Where(l => l.AssignedToId == u.Id)
            .ToListAsync();
        var totalLeads = userLeads.Count;
        var completedLeads = userLeads.Count(l =>
            string.Equals(l.Status, "CONVERTED", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(l.Status, "Converted", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(l.Status, "WON", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(l.Status, "Won", StringComparison.OrdinalIgnoreCase));

        double conversionRate = totalLeads > 0 ? (double)completedLeads / totalLeads : 0.0;
        int leadProgressSum = userLeads.Sum(l => l.ProgressPercentage ?? 0);
        double avgLeadProgress = totalLeads > 0 ? (double)leadProgressSum / totalLeads : 0.0;

        // 3. Sales Activities & Outreach Metrics
        var activitiesCount = await _context.SalesActivityLogs.CountAsync(a => a.LoggedById == u.Id);
        var callsCount = await _context.CallHistories.CountAsync(c => c.UserId == u.Id);
        var completedFollowups = await _context.FollowupReminders.CountAsync(f => f.AssignedToId == u.Id && (f.Status == "COMPLETED" || f.Status == "Completed"));
        var stageUpdatesCount = await _context.LeadHistories.CountAsync(h => h.PerformedById == u.Id);

        var totalOutreachEffort = activitiesCount + callsCount + completedFollowups + stageUpdatesCount;

        double avgResponseTime = 4.0;
        if (completedTasks + completedLeads + totalOutreachEffort > 0)
        {
            avgResponseTime = Math.Max(1.0, 4.0 - (0.05 * (completedTasks + completedLeads + totalOutreachEffort)));
        }

        // 4. Performance Index Composite Calculation
        double taskScore = totalTasks > 0 ? ((double)completedTasks / totalTasks) * 100.0 : 0.0;
        double leadScore = avgLeadProgress; // 0 to 100
        double conversionScore = conversionRate * 100.0;
        double activityScore = Math.Min(100.0, totalOutreachEffort * 10.0);

        double score = 0.0;
        if (totalTasks > 0 && totalLeads > 0)
        {
            score = (taskScore * 0.30) + (leadScore * 0.30) + (conversionScore * 0.25) + (activityScore * 0.15);
        }
        else if (totalTasks > 0)
        {
            score = (taskScore * 0.70) + (activityScore * 0.30);
        }
        else if (totalLeads > 0)
        {
            score = (leadScore * 0.45) + (conversionScore * 0.35) + (activityScore * 0.20);
        }
        else if (totalOutreachEffort > 0)
        {
            score = Math.Min(95.0, 45.0 + (totalOutreachEffort * 7.5));
        }
        else
        {
            score = string.Equals("AVAILABLE", u.AvailabilityStatus, StringComparison.OrdinalIgnoreCase) ? 55.0 : 35.0;
        }

        score = Math.Round(score * 10.0) / 10.0;
        score = Math.Min(100.0, Math.Max(0.0, score));

        var category = "Needs Improvement";
        if (score >= 75.0)
        {
            category = "Top Performer";
        }
        else if (score >= 45.0)
        {
            category = "Average Performer";
        }

        return new TeamProductivityDto
        {
            UserId = u.Id,
            FullName = u.FullName,
            CompletedTasks = completedTasks,
            CompletedLeads = completedLeads,
            ConversionRate = conversionRate,
            AverageResponseTime = avgResponseTime,
            Score = score,
            Category = category
        };
    }
}
