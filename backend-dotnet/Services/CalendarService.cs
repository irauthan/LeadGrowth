using LeadGrowth.Data;
using LeadGrowth.DTOs;
using LeadGrowth.Models;
using Microsoft.EntityFrameworkCore;

namespace LeadGrowth.Services;

public class CalendarService : ICalendarService
{
    private readonly LeadGrowthDbContext _context;

    public CalendarService(LeadGrowthDbContext context)
    {
        _context = context;
    }

    public async Task<List<CalendarEventDto>> GetCalendarEventsAsync(string email, string? start, string? end)
    {
        var userEmail = email.Trim().ToLower();
        var user = await _context.Users
            .Include(u => u.Workspace)
            .FirstOrDefaultAsync(u => u.Email == userEmail);

        if (user == null || user.WorkspaceId == null)
        {
            throw new KeyNotFoundException("User workspace not found");
        }

        DateTime? startDate = null;
        DateTime? endDate = null;
        if (DateTime.TryParse(start, out var s)) startDate = s.Date;
        if (DateTime.TryParse(end, out var e)) endDate = e.Date.AddDays(1);

        var result = new List<CalendarEventDto>();

        // 1. Direct Calendar Events
        var calQuery = _context.CalendarEvents
            .Include(ce => ce.Lead)
            .Include(ce => ce.AssignedUser)
            .Where(ce => ce.WorkspaceId == user.WorkspaceId);

        if (startDate.HasValue) calQuery = calQuery.Where(ce => ce.StartTime >= startDate.Value);
        if (endDate.HasValue) calQuery = calQuery.Where(ce => ce.EndTime <= endDate.Value);

        var events = await calQuery.ToListAsync();
        result.AddRange(events.Select(ConvertToDto));

        // 2. Followup Reminders (Live client follow-ups across stages)
        var followupQuery = _context.FollowupReminders
            .Include(f => f.Lead).ThenInclude(l => l.AssignedTo)
            .Include(f => f.AssignedTo)
            .Where(f => f.WorkspaceId == user.WorkspaceId && f.Status != "CANCELLED");

        if (startDate.HasValue) followupQuery = followupQuery.Where(f => f.ScheduledAt >= startDate.Value);
        if (endDate.HasValue) followupQuery = followupQuery.Where(f => f.ScheduledAt <= endDate.Value);

        var followups = await followupQuery.ToListAsync();
        foreach (var f in followups)
        {
            // Avoid duplicate if already in CalendarEvents
            if (result.Any(r => r.LeadId == f.LeadId && Math.Abs((r.StartTime - f.ScheduledAt).TotalMinutes) < 5))
            {
                continue;
            }

            var assigneeId = f.Lead?.AssignedToId ?? f.AssignedToId;
            var assigneeName = f.Lead?.AssignedTo?.FullName ?? f.AssignedTo?.FullName;

            result.Add(new CalendarEventDto
            {
                Id = 100000 + f.Id,
                WorkspaceId = f.WorkspaceId,
                LeadId = f.LeadId,
                LeadName = f.Lead?.Name,
                UserId = assigneeId,
                AssignedUserId = assigneeId,
                Title = $"{f.Lead?.Name ?? "Client"} - Follow-up ({f.Type})",
                Description = string.IsNullOrWhiteSpace(f.Notes) ? $"Scheduled {f.Type} follow-up for {f.Lead?.Name}" : f.Notes,
                StartTime = f.ScheduledAt,
                EndTime = f.ScheduledAt.AddMinutes(30),
                EventType = "FOLLOW_UP",
                ReminderSent = false,
                ReminderMinutes = 15,
                Status = f.Status == "COMPLETED" ? "COMPLETED" : "SCHEDULED",
                CreatedAt = f.CreatedAt
            });
        }

        // 3. Client Interaction / Call History Logs (Recorded conversations & calls with clients)
        var logsQuery = _context.SalesActivityLogs
            .Include(l => l.Lead)
            .Include(l => l.LoggedBy)
            .Where(l => l.Lead != null && l.Lead.WorkspaceId == user.WorkspaceId);

        if (startDate.HasValue) logsQuery = logsQuery.Where(l => l.CreatedAt >= startDate.Value);
        if (endDate.HasValue) logsQuery = logsQuery.Where(l => l.CreatedAt <= endDate.Value);

        var activityLogs = await logsQuery.Take(200).ToListAsync();
        foreach (var log in activityLogs)
        {
            string commType = (log.CommunicationType ?? "CALL").Replace("_", " ");
            var logDt = log.CreatedAt ?? DateTime.UtcNow;
            result.Add(new CalendarEventDto
            {
                Id = 200000 + log.Id,
                WorkspaceId = user.WorkspaceId.Value,
                LeadId = log.LeadId,
                LeadName = log.Lead?.Name,
                UserId = log.LoggedById,
                AssignedUserId = log.LoggedById,
                Title = $"{log.Lead?.Name ?? "Client"} - {commType} ({log.Outcome})",
                Description = string.IsNullOrWhiteSpace(log.Remarks) ? $"Duration: {log.Duration ?? "N/A"} • Outcome: {log.Outcome}" : $"{log.Remarks} (Duration: {log.Duration ?? "N/A"})",
                StartTime = logDt,
                EndTime = logDt.AddMinutes(15),
                EventType = "CALL_REMINDER",
                ReminderSent = false,
                ReminderMinutes = 0,
                Status = "COMPLETED",
                CreatedAt = logDt
            });
        }

        // 4. Tasks & Deadlines
        var taskQuery = _context.Tasks
            .Include(t => t.AssignedTo)
            .Where(t => t.WorkspaceId == user.WorkspaceId);

        var tasks = await taskQuery.ToListAsync();
        foreach (var t in tasks)
        {
            if (t.DueDate.HasValue)
            {
                var dueDt = t.DueDate.Value.ToDateTime(new TimeOnly(18, 0));
                if ((!startDate.HasValue || dueDt >= startDate.Value) && (!endDate.HasValue || dueDt <= endDate.Value))
                {
                    result.Add(new CalendarEventDto
                    {
                        Id = 300000 + t.Id,
                        WorkspaceId = t.WorkspaceId,
                        LeadId = null,
                        LeadName = null,
                        UserId = t.AssignedToId,
                        AssignedUserId = t.AssignedToId,
                        Title = $"Task: {t.Title}",
                        Description = t.Description,
                        StartTime = dueDt,
                        EndTime = dueDt.AddMinutes(30),
                        EventType = "TASK",
                        ReminderSent = false,
                        ReminderMinutes = 30,
                        Status = t.Status == "COMPLETED" || t.Status == "DONE" ? "COMPLETED" : "SCHEDULED",
                        CreatedAt = t.CreatedAt
                    });
                }
            }
        }

        return result.OrderBy(r => r.StartTime).ToList();
    }

    public async Task<CalendarEventDto> CreateEventAsync(CreateCalendarEventRequest request, string email)
    {
        var userEmail = email.Trim().ToLower();
        var user = await _context.Users
            .Include(u => u.Workspace)
            .FirstOrDefaultAsync(u => u.Email == userEmail);

        if (user == null || user.WorkspaceId == null)
        {
            throw new KeyNotFoundException("User workspace not found");
        }

        var calEvent = new CalendarEvent
        {
            WorkspaceId = user.WorkspaceId.Value,
            Workspace = user.Workspace!,
            LeadId = request.LeadId,
            AssignedUserId = request.AssignedUserId ?? user.Id,
            Title = request.Title,
            Description = request.Description,
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            EventType = request.EventType,
            ReminderMinutes = request.ReminderMinutes,
            Status = "SCHEDULED",
            CreatedAt = DateTime.UtcNow
        };

        _context.CalendarEvents.Add(calEvent);
        await _context.SaveChangesAsync();

        return ConvertToDto(calEvent);
    }

    public async Task<CalendarEventDto> UpdateEventAsync(long id, CreateCalendarEventRequest request, string email)
    {
        var calEvent = await _context.CalendarEvents
            .Include(e => e.Lead)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (calEvent == null)
        {
            throw new ArgumentException("Calendar event not found");
        }

        calEvent.Title = request.Title;
        calEvent.Description = request.Description;
        calEvent.StartTime = request.StartTime;
        calEvent.EndTime = request.EndTime;
        calEvent.EventType = request.EventType;
        calEvent.ReminderMinutes = request.ReminderMinutes;
        if (request.LeadId.HasValue) calEvent.LeadId = request.LeadId;
        if (request.AssignedUserId.HasValue) calEvent.AssignedUserId = request.AssignedUserId;

        await _context.SaveChangesAsync();
        return ConvertToDto(calEvent);
    }

    public async Task<CalendarEventDto> CompleteEventAsync(long id, string email)
    {
        if (id >= 100000 && id < 200000)
        {
            long fId = id - 100000;
            var followup = await _context.FollowupReminders.Include(f => f.Lead).FirstOrDefaultAsync(f => f.Id == fId);
            if (followup != null)
            {
                followup.Status = "COMPLETED";
                if (followup.Lead != null)
                {
                    followup.Lead.LastFollowupDate = DateTime.UtcNow;
                }
                await _context.SaveChangesAsync();
                return new CalendarEventDto
                {
                    Id = id,
                    Title = $"{followup.Lead?.Name ?? "Client"} - Follow-up ({followup.Type})",
                    StartTime = followup.ScheduledAt,
                    EndTime = followup.ScheduledAt.AddMinutes(30),
                    Status = "COMPLETED",
                    EventType = "FOLLOW_UP"
                };
            }
        }
        else if (id >= 200000 && id < 300000)
        {
            long logId = id - 200000;
            var log = await _context.SalesActivityLogs.Include(l => l.Lead).FirstOrDefaultAsync(l => l.Id == logId);
            if (log != null)
            {
                log.Status = "COMPLETED";
                await _context.SaveChangesAsync();
                return new CalendarEventDto
                {
                    Id = id,
                    Title = $"{log.Lead?.Name ?? "Client"} - Call (Completed)",
                    Status = "COMPLETED",
                    EventType = "CALL_REMINDER"
                };
            }
        }
        else if (id >= 300000)
        {
            long tId = id - 300000;
            var task = await _context.Tasks.FirstOrDefaultAsync(t => t.Id == tId);
            if (task != null)
            {
                task.Status = "COMPLETED";
                await _context.SaveChangesAsync();
                return new CalendarEventDto
                {
                    Id = id,
                    Title = $"Task: {task.Title}",
                    Status = "COMPLETED",
                    EventType = "TASK"
                };
            }
        }

        var calEvent = await _context.CalendarEvents
            .Include(e => e.Lead)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (calEvent != null)
        {
            calEvent.Status = "COMPLETED";
            await _context.SaveChangesAsync();
            return ConvertToDto(calEvent);
        }

        return new CalendarEventDto { Id = id, Status = "COMPLETED" };
    }

    public async Task DeleteEventAsync(long id, string email)
    {
        if (id >= 100000 && id < 200000)
        {
            long fId = id - 100000;
            var followup = await _context.FollowupReminders.Include(f => f.Lead).FirstOrDefaultAsync(f => f.Id == fId);
            if (followup != null)
            {
                if (followup.Lead != null)
                {
                    followup.Lead.LastFollowupDate = DateTime.UtcNow;
                }
                _context.FollowupReminders.Remove(followup);
                await _context.SaveChangesAsync();
            }
            return;
        }

        if (id >= 200000 && id < 300000)
        {
            long logId = id - 200000;
            var activityLog = await _context.SalesActivityLogs.FirstOrDefaultAsync(l => l.Id == logId);
            if (activityLog != null)
            {
                _context.SalesActivityLogs.Remove(activityLog);
                await _context.SaveChangesAsync();
            }
            return;
        }

        if (id >= 300000)
        {
            long tId = id - 300000;
            var task = await _context.Tasks.FirstOrDefaultAsync(t => t.Id == tId);
            if (task != null)
            {
                _context.Tasks.Remove(task);
                await _context.SaveChangesAsync();
            }
            return;
        }

        var calEvent = await _context.CalendarEvents.FirstOrDefaultAsync(e => e.Id == id);
        if (calEvent != null)
        {
            _context.CalendarEvents.Remove(calEvent);
            await _context.SaveChangesAsync();
        }
    }

    public async Task SyncFollowupToCalendarAsync(FollowupReminder followup)
    {
        var existing = await _context.CalendarEvents.FirstOrDefaultAsync(e => e.LeadId == followup.LeadId && e.Title.Contains("Follow-up"));
        if (existing != null)
        {
            existing.StartTime = followup.ScheduledAt;
            existing.EndTime = followup.ScheduledAt.AddMinutes(30);
            if (string.Equals("COMPLETED", followup.Status, StringComparison.OrdinalIgnoreCase))
            {
                existing.Status = "COMPLETED";
            }
        }
        else
        {
            var newEvent = new CalendarEvent
            {
                WorkspaceId = followup.WorkspaceId,
                LeadId = followup.LeadId,
                AssignedUserId = followup.AssignedToId,
                Title = $"Follow-up ({followup.Type}): Lead #{followup.LeadId}",
                Description = followup.Notes,
                StartTime = followup.ScheduledAt,
                EndTime = followup.ScheduledAt.AddMinutes(30),
                EventType = followup.Type,
                Status = followup.Status,
                CreatedAt = DateTime.UtcNow
            };
            _context.CalendarEvents.Add(newEvent);
        }
        await _context.SaveChangesAsync();
    }

    private static CalendarEventDto ConvertToDto(CalendarEvent e)
    {
        return new CalendarEventDto
        {
            Id = e.Id,
            WorkspaceId = e.WorkspaceId,
            LeadId = e.LeadId,
            LeadName = e.Lead != null ? e.Lead.Name : null,
            UserId = e.AssignedUserId,
            AssignedUserId = e.AssignedUserId,
            Title = e.Title,
            Description = e.Description,
            StartTime = e.StartTime,
            EndTime = e.EndTime,
            EventType = e.EventType,
            ReminderSent = e.ReminderSent,
            ReminderMinutes = e.ReminderMinutes,
            Status = e.Status,
            CreatedAt = e.CreatedAt
        };
    }
}
