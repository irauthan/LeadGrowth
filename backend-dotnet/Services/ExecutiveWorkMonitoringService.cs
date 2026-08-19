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
        var totalWorkUnits = callsCount + tasksCount + stageUpdatesCount;

        var leadWorkList = await _context.Leads
            .Where(l => l.AssignedToId == targetUserId)
            .Take(10)
            .Select(l => new ExecutiveLeadWorkDto
            {
                LeadId = l.Id,
                LeadName = l.Name,
                Status = l.Status,
                ActivityCount = _context.SalesActivityLogs.Count(a => a.LeadId == l.Id),
                LastWorkedAt = l.CreatedAt
            })
            .ToListAsync();

        return new ExecutiveWorkSummaryDto
        {
            UserId = targetUser.Id,
            FullName = targetUser.FullName,
            Designation = targetUser.Designation,
            TotalWorkUnits = totalWorkUnits,
            CallsCount = callsCount,
            TasksCompletedCount = tasksCount,
            StageUpdatesCount = stageUpdatesCount,
            LeadWork = leadWorkList
        };
    }
}
