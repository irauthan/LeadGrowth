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
        var actor = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (actor == null || actor.WorkspaceId == null)
        {
            throw new KeyNotFoundException("Actor not found");
        }

        var targetUserId = userId ?? actor.Id;
        var targetUser = await _context.Users.FirstOrDefaultAsync(u => u.Id == targetUserId);
        if (targetUser == null)
        {
            throw new KeyNotFoundException("Target executive not found");
        }

        var calls = await _context.CallHistories
            .Where(c => c.UserId == targetUserId)
            .ToListAsync();

        var tasks = await _context.Tasks
            .Where(t => t.AssignedToId == targetUserId && (t.Status == "COMPLETED" || t.Status == "APPROVED"))
            .ToListAsync();

        var leadHistories = await _context.LeadHistories
            .Where(h => h.PerformedById == targetUserId)
            .ToListAsync();

        var callsCount = calls.Count;
        var tasksCount = tasks.Count;
        var stageUpdatesCount = leadHistories.Count;
        var totalAssignedLeads = await _context.Leads.CountAsync(l => l.AssignedToId == targetUserId);
        var convertedLeads = await _context.Leads.CountAsync(l => l.AssignedToId == targetUserId && (l.Status == "CONVERTED" || l.Status == "WON"));
        var overdueFollowups = await _context.Tasks.CountAsync(t => t.AssignedToId == targetUserId && t.Status == "PENDING" && t.DueDate < DateOnly.FromDateTime(DateTime.UtcNow));
        
        var activities = await _context.SalesActivityLogs.Where(a => a.LoggedById == targetUserId).ToListAsync();
        var emailsCount = activities.Count(a => a.CommunicationType == "EMAIL");
        var meetingsCount = activities.Count(a => a.CommunicationType == "MEETING");
        var whatsappCount = activities.Count(a => a.CommunicationType == "WHATSAPP");

        var leadWorkList = await _context.Leads
            .Where(l => l.AssignedToId == targetUserId)
            .Take(10)
            .Select(l => new ExecutiveLeadWorkDto
            {
                LeadId = l.Id,
                LeadName = l.Name,
                LeadPhone = l.Phone,
                LeadStatus = l.Status,
                AssignedToName = targetUser.FullName,
                ActivityCount = _context.SalesActivityLogs.Count(a => a.LeadId == l.Id),
                LastWorkedAt = l.CreatedAt
            })
            .ToListAsync();

        var breakdown = new List<ExecutiveDayBreakdownDto>();
        for (int i = 0; i < 7; i++)
        {
            var d = DateTime.UtcNow.Date.AddDays(-i);
            breakdown.Add(new ExecutiveDayBreakdownDto
            {
                Date = d.ToString("yyyy-MM-dd"),
                DayOfWeek = d.DayOfWeek.ToString(),
                CallsCount = calls.Count(c => c.CreatedAt.GetValueOrDefault().Date == d),
                MeetingsCount = activities.Count(a => a.CommunicationType == "MEETING" && a.CreatedAt.GetValueOrDefault().Date == d),
                EmailsCount = activities.Count(a => a.CommunicationType == "EMAIL" && a.CreatedAt.GetValueOrDefault().Date == d),
                WhatsappCount = activities.Count(a => a.CommunicationType == "WHATSAPP" && a.CreatedAt.GetValueOrDefault().Date == d),
                TotalActivitiesCount = activities.Count(a => a.CreatedAt.GetValueOrDefault().Date == d) + calls.Count(c => c.CreatedAt.GetValueOrDefault().Date == d),
                FollowupsCompletedCount = tasks.Count(t => t.CreatedAt.Date == d)
            });
        }

        return new ExecutiveWorkSummaryDto
        {
            UserId = targetUser.Id,
            UserName = targetUser.FullName,
            UserEmail = targetUser.Email,
            UserRole = targetUser.Designation ?? "Executive",
            Timeframe = timeframe,
            TotalAssignedLeads = totalAssignedLeads,
            TotalActivitiesLogged = activities.Count,
            TotalCallsMade = callsCount,
            TotalMeetingsHeld = meetingsCount,
            TotalEmailsSent = emailsCount,
            TotalWhatsappSent = whatsappCount,
            CompletedFollowupsCount = tasksCount,
            OverdueFollowupsCount = overdueFollowups,
            TotalConvertedLeads = convertedLeads,
            ConversionRate = totalAssignedLeads > 0 ? (double)convertedLeads / totalAssignedLeads : 0,
            ActivityCompletionRate = 1.0,
            DailyBreakdown = breakdown,
            LeadWorkList = leadWorkList
        };
    }
}
