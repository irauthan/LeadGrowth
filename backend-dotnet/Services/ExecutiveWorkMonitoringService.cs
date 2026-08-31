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
        
        // Regular executives (ROLE_USER) can only view their own monitoring data
        long targetUserId;
        if (!isPrivileged)
        {
            targetUserId = actor.Id;
        }
        else
        {
            targetUserId = (userId.HasValue && userId.Value > 0) ? userId.Value : actor.Id;
        }

        var targetUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == targetUserId && u.WorkspaceId == actor.WorkspaceId);
            
        if (targetUser == null)
        {
            throw new KeyNotFoundException("Target executive not found in workspace");
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
        var callsQuery = _context.CallHistories.Where(c => c.UserId == targetUserId);
        var tasksQuery = _context.Tasks.Where(t => t.AssignedToId == targetUserId);
        var activitiesQuery = _context.SalesActivityLogs.Where(a => a.LoggedById == targetUserId);
        var leadHistoriesQuery = _context.LeadHistories.Where(h => h.PerformedById == targetUserId);

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
        var totalAssignedLeads = await _context.Leads.CountAsync(l => l.AssignedToId == targetUserId && l.WorkspaceId == actor.WorkspaceId);
        var convertedLeads = await _context.Leads.CountAsync(l => l.AssignedToId == targetUserId && l.WorkspaceId == actor.WorkspaceId && (l.Status == "CONVERTED" || l.Status == "WON"));
        var completedFollowups = tasks.Count(t => t.Status == "COMPLETED" || t.Status == "APPROVED");
        var overdueFollowups = tasks.Count(t => t.Status == "PENDING" && t.DueDate < DateOnly.FromDateTime(DateTime.UtcNow));
        
        var emailsCount = activities.Count(a => a.CommunicationType == "EMAIL");
        var meetingsCount = activities.Count(a => a.CommunicationType == "MEETING" || a.CommunicationType == "DEMO");
        var whatsappCount = activities.Count(a => a.CommunicationType == "WHATSAPP");

        var leads = await _context.Leads
            .Where(l => l.AssignedToId == targetUserId && l.WorkspaceId == actor.WorkspaceId)
            .OrderByDescending(l => l.CreatedAt)
            .Take(100)
            .ToListAsync();

        var leadIds = leads.Select(l => l.Id).ToList();

        var allActivityLogs = leadIds.Count > 0
            ? await _context.SalesActivityLogs
                .Include(a => a.LoggedBy)
                .Where(a => leadIds.Contains(a.LeadId))
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync()
            : new List<SalesActivityLog>();

        var allFollowups = leadIds.Count > 0
            ? await _context.FollowupReminders
                .Where(f => leadIds.Contains(f.LeadId))
                .OrderByDescending(f => f.ScheduledAt)
                .ToListAsync()
            : new List<FollowupReminder>();

        var allHistories = leadIds.Count > 0
            ? await _context.LeadHistories
                .Include(h => h.PerformedBy)
                .Where(h => leadIds.Contains(h.LeadId))
                .OrderByDescending(h => h.Timestamp)
                .ToListAsync()
            : new List<LeadHistory>();

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
                AssignedToName = targetUser.FullName,
                AssignedToId = targetUser.Id,
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
                    LoggedByName = a.LoggedBy != null ? a.LoggedBy.FullName : targetUser.FullName
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
            UserId = targetUser.Id,
            UserName = targetUser.FullName,
            UserEmail = targetUser.Email,
            UserRole = targetUser.Designation ?? "Executive",
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
