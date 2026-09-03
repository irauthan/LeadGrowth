using LeadGrowth.Data;
using LeadGrowth.DTOs;
using LeadGrowth.Models;
using Microsoft.EntityFrameworkCore;

namespace LeadGrowth.Services;

public class ExecutiveWorkMonitoringService : IExecutiveWorkMonitoringService
{
    private readonly LeadGrowthDbContext _context;

    public ExecutiveWorkMonitoringService(LeadGrowthDbContext context)
    {
        _context = context;
    }

    public async Task<ExecutiveWorkSummaryDto> GetExecutiveWorkSummaryAsync(string actorEmail, long? userId, string timeframe, string? startDate, string? endDate)
    {
        var email = actorEmail.Trim().ToLower();
        var actor = await _context.Users
            .Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.Email == email);
            
        if (actor == null || actor.WorkspaceId == null)
        {
            throw new KeyNotFoundException("Actor not found or not in workspace");
        }

        bool isPrivileged = actor.Roles.Any(r => r.Name == "ROLE_ADMIN" || r.Name == "ROLE_MANAGER");
        
        bool isTeamView = isPrivileged && (!userId.HasValue || userId.Value <= 0);
        long targetUserId = (!isPrivileged) ? actor.Id : (userId.HasValue ? userId.Value : 0);

        User? targetUser = null;
        if (!isTeamView)
        {
            targetUser = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == targetUserId && u.WorkspaceId == actor.WorkspaceId);
                
            if (targetUser == null)
            {
                throw new KeyNotFoundException("Target executive not found in workspace");
            }
        }

        // Calculate Date Range based on timeframe
        DateTime? filterStart = null;
        DateTime? filterEnd = null;
        var now = DateTime.UtcNow;

        switch (timeframe?.ToUpperInvariant())
        {
            case "TODAY":
                filterStart = now.Date;
                filterEnd = now.Date.AddDays(1).AddTicks(-1);
                break;
            case "YESTERDAY":
                filterStart = now.Date.AddDays(-1);
                filterEnd = now.Date.AddTicks(-1);
                break;
            case "THIS_WEEK":
                int diff = (7 + (now.Date.DayOfWeek - DayOfWeek.Monday)) % 7;
                filterStart = now.Date.AddDays(-diff);
                filterEnd = now.Date.AddDays(1).AddTicks(-1);
                break;
            case "THIS_MONTH":
                filterStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
                filterEnd = filterStart.Value.AddMonths(1).AddTicks(-1);
                break;
            case "CUSTOM":
                if (DateTime.TryParse(startDate, out var parsedStart))
                    filterStart = DateTime.SpecifyKind(parsedStart.Date, DateTimeKind.Utc);
                if (DateTime.TryParse(endDate, out var parsedEnd))
                    filterEnd = DateTime.SpecifyKind(parsedEnd.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc);
                break;
            default:
                filterStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
                filterEnd = filterStart.Value.AddMonths(1).AddTicks(-1);
                break;
        }

        // Base queries
        var callsQuery = isTeamView
            ? _context.CallHistories.Where(c => c.WorkspaceId == actor.WorkspaceId)
            : _context.CallHistories.Where(c => c.UserId == targetUserId);

        var tasksQuery = isTeamView
            ? _context.Tasks.Where(t => t.WorkspaceId == actor.WorkspaceId)
            : _context.Tasks.Where(t => t.AssignedToId == targetUserId);

        var activitiesQuery = isTeamView
            ? _context.SalesActivityLogs.Where(a => a.Lead != null && a.Lead.WorkspaceId == actor.WorkspaceId)
            : _context.SalesActivityLogs.Where(a => a.LoggedById == targetUserId);

        var leadHistoriesQuery = isTeamView
            ? _context.LeadHistories.Where(h => h.Lead != null && h.Lead.WorkspaceId == actor.WorkspaceId)
            : _context.LeadHistories.Where(h => h.PerformedById == targetUserId);

        if (filterStart.HasValue)
        {
            callsQuery = callsQuery.Where(c => c.CreatedAt >= filterStart.Value);
            activitiesQuery = activitiesQuery.Where(a => a.CreatedAt >= filterStart.Value);
            leadHistoriesQuery = leadHistoriesQuery.Where(h => h.Timestamp >= filterStart.Value);
        }
        if (filterEnd.HasValue)
        {
            callsQuery = callsQuery.Where(c => c.CreatedAt <= filterEnd.Value);
            activitiesQuery = activitiesQuery.Where(a => a.CreatedAt <= filterEnd.Value);
            leadHistoriesQuery = leadHistoriesQuery.Where(h => h.Timestamp <= filterEnd.Value);
        }

        var calls = await callsQuery.ToListAsync();
        var activities = await activitiesQuery.ToListAsync();
        var leadHistories = await leadHistoriesQuery.ToListAsync();
        var tasks = await tasksQuery.ToListAsync();

        var callsCount = calls.Count;
        var totalAssignedLeads = isTeamView
            ? await _context.Leads.CountAsync(l => l.WorkspaceId == actor.WorkspaceId)
            : await _context.Leads.CountAsync(l => l.AssignedToId == targetUserId && l.WorkspaceId == actor.WorkspaceId);

        var convertedLeads = isTeamView
            ? await _context.Leads.CountAsync(l => l.WorkspaceId == actor.WorkspaceId && (l.Status == "CONVERTED" || l.Status == "WON"))
            : await _context.Leads.CountAsync(l => l.AssignedToId == targetUserId && l.WorkspaceId == actor.WorkspaceId && (l.Status == "CONVERTED" || l.Status == "WON"));

        var completedFollowups = tasks.Count(t => t.Status == "COMPLETED" || t.Status == "APPROVED");
        var overdueFollowups = tasks.Count(t => t.Status == "PENDING" && t.DueDate < DateOnly.FromDateTime(DateTime.UtcNow));
        
        var emailsCount = activities.Count(a => a.CommunicationType == "EMAIL");
        var meetingsCount = activities.Count(a => a.CommunicationType == "MEETING" || a.CommunicationType == "DEMO");
        var whatsappCount = activities.Count(a => a.CommunicationType == "WHATSAPP");

        var leads = isTeamView
            ? await _context.Leads
                .Include(l => l.AssignedTo)
                .Where(l => l.WorkspaceId == actor.WorkspaceId)
                .OrderByDescending(l => l.CreatedAt)
                .Take(100)
                .ToListAsync()
            : await _context.Leads
                .Include(l => l.AssignedTo)
                .Where(l => l.AssignedToId == targetUserId && l.WorkspaceId == actor.WorkspaceId)
                .OrderByDescending(l => l.CreatedAt)
                .Take(100)
                .ToListAsync();

        var allActivityLogs = isTeamView
            ? await _context.SalesActivityLogs
                .Include(a => a.LoggedBy)
                .Where(a => a.Lead != null && a.Lead.WorkspaceId == actor.WorkspaceId)
                .OrderByDescending(a => a.CreatedAt)
                .Take(500)
                .ToListAsync()
            : await _context.SalesActivityLogs
                .Include(a => a.LoggedBy)
                .Where(a => a.LoggedById == targetUserId)
                .OrderByDescending(a => a.CreatedAt)
                .Take(500)
                .ToListAsync();

        var allFollowups = isTeamView
            ? await _context.FollowupReminders
                .Where(f => f.WorkspaceId == actor.WorkspaceId)
                .OrderByDescending(f => f.ScheduledAt)
                .Take(500)
                .ToListAsync()
            : await _context.FollowupReminders
                .Where(f => (f.AssignedToId == targetUserId || f.WorkspaceId == actor.WorkspaceId))
                .OrderByDescending(f => f.ScheduledAt)
                .Take(500)
                .ToListAsync();

        var allHistories = isTeamView
            ? await _context.LeadHistories
                .Include(h => h.PerformedBy)
                .Where(h => h.Lead != null && h.Lead.WorkspaceId == actor.WorkspaceId)
                .OrderByDescending(h => h.Timestamp)
                .Take(500)
                .ToListAsync()
            : await _context.LeadHistories
                .Include(h => h.PerformedBy)
                .Where(h => h.PerformedById == targetUserId)
                .OrderByDescending(h => h.Timestamp)
                .Take(500)
                .ToListAsync();

        var leadWorkList = leads.Select(l =>
        {
            var leadActivities = allActivityLogs.Where(a => a.LeadId == l.Id).ToList();
            var leadFollowups = allFollowups.Where(f => f.LeadId == l.Id).ToList();
            var leadTimeline = allHistories.Where(h => h.LeadId == l.Id).ToList();

            return new ExecutiveLeadWorkDto
            {
                LeadId = l.Id,
                LeadName = l.Name,
                LeadPhone = l.Phone,
                LeadEmail = l.Email,
                LeadStatus = l.Status ?? "NEW",
                Priority = l.Priority ?? "MEDIUM",
                AssignedToName = l.AssignedTo?.FullName ?? (targetUser?.FullName ?? "Unassigned"),
                AssignedToId = l.AssignedToId ?? (targetUser?.Id ?? 0),
                ActivityCount = leadActivities.Count,
                TotalActivitiesCount = leadActivities.Count,
                LastWorkedAt = l.CreatedAt,
                LastActivityAt = l.CreatedAt,
                ActivityLogs = leadActivities.Select(a => new ExecutiveActivityLogDto
                {
                    Id = a.Id,
                    ActivityNumber = a.ActivityNumber,
                    CommunicationType = a.CommunicationType,
                    Outcome = a.Outcome,
                    Duration = a.Duration,
                    Remarks = a.Remarks,
                    CreatedAt = a.CreatedAt,
                    LoggedByName = a.LoggedBy != null ? a.LoggedBy.FullName : (targetUser?.FullName ?? "Executive")
                }).ToList(),
                Followups = leadFollowups.Select(f => new ExecutiveFollowupDto
                {
                    Id = f.Id,
                    Status = f.Status,
                    Type = f.Type,
                    Notes = f.Notes,
                    Remarks = f.Notes,
                    Outcome = f.Status,
                    ScheduledAt = f.ScheduledAt,
                    CompletedAt = f.Status == "COMPLETED" ? f.CreatedAt : null,
                    IsOverdue = f.Status != "COMPLETED" && f.ScheduledAt < DateTime.UtcNow
                }).ToList(),
                TimelineHistory = leadTimeline.Select(h => new ExecutiveTimelineHistoryDto
                {
                    Id = h.Id,
                    Action = h.Action,
                    Description = h.Description,
                    Details = h.Description,
                    PreviousStatus = h.PreviousStatus,
                    NewStatus = h.NewStatus,
                    Timestamp = h.Timestamp,
                    CreatedAt = h.Timestamp,
                    PerformedByName = h.PerformedBy != null ? h.PerformedBy.FullName : "System"
                }).ToList()
            };
        }).ToList();

        var breakdown = new List<ExecutiveDayBreakdownDto>();
        int daysCount = timeframe == "TODAY" ? 1 : (timeframe == "YESTERDAY" ? 2 : (timeframe == "THIS_WEEK" ? 7 : 14));
        for (int i = 0; i < daysCount; i++)
        {
            var d = DateTime.UtcNow.Date.AddDays(-i);
            breakdown.Add(new ExecutiveDayBreakdownDto
            {
                Date = d.ToString("yyyy-MM-dd"),
                DayOfWeek = d.DayOfWeek.ToString(),
                CallsCount = calls.Count(c => c.CreatedAt.GetValueOrDefault().Date == d),
                MeetingsCount = activities.Count(a => (a.CommunicationType == "MEETING" || a.CommunicationType == "DEMO") && a.CreatedAt.GetValueOrDefault().Date == d),
                EmailsCount = activities.Count(a => a.CommunicationType == "EMAIL" && a.CreatedAt.GetValueOrDefault().Date == d),
                WhatsappCount = activities.Count(a => a.CommunicationType == "WHATSAPP" && a.CreatedAt.GetValueOrDefault().Date == d),
                TotalActivitiesCount = activities.Count(a => a.CreatedAt.GetValueOrDefault().Date == d) + calls.Count(c => c.CreatedAt.GetValueOrDefault().Date == d),
                FollowupsCompletedCount = tasks.Count(t => (t.Status == "COMPLETED" || t.Status == "APPROVED") && t.CreatedAt.Date == d)
            });
        }

        return new ExecutiveWorkSummaryDto
        {
            UserId = targetUser?.Id ?? 0,
            UserName = targetUser?.FullName ?? "All Staff & Executive Team Members",
            UserEmail = targetUser?.Email ?? "Team Aggregation",
            UserRole = targetUser?.Designation ?? (isTeamView ? "All Team Members" : "Executive"),
            Timeframe = timeframe ?? "THIS_MONTH",
            TotalAssignedLeads = totalAssignedLeads,
            TotalActivitiesLogged = activities.Count,
            TotalCallsMade = callsCount,
            TotalMeetingsHeld = meetingsCount,
            TotalEmailsSent = emailsCount,
            TotalWhatsappSent = whatsappCount,
            CompletedFollowupsCount = completedFollowups,
            OverdueFollowupsCount = overdueFollowups,
            TotalConvertedLeads = convertedLeads,
            ConversionRate = totalAssignedLeads > 0 ? (double)convertedLeads / totalAssignedLeads : 0,
            ActivityCompletionRate = (totalAssignedLeads > 0 && activities.Count > 0) ? Math.Min(1.0, (double)activities.Count / totalAssignedLeads) : 1.0,
            DailyBreakdown = breakdown,
            LeadWorkList = leadWorkList
        };
    }
}
