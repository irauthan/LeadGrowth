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

        var events = await _context.CalendarEvents
            .Include(e => e.Lead)
            .Include(e => e.AssignedUser)
            .Where(e => e.WorkspaceId == user.WorkspaceId)
            .ToListAsync();

        if (DateTime.TryParse(start, out var startDate))
        {
            events = events.Where(e => e.StartTime >= startDate).ToList();
        }

        if (DateTime.TryParse(end, out var endDate))
        {
            events = events.Where(e => e.EndTime <= endDate).ToList();
        }

        return events.Select(ConvertToDto).ToList();
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
        var calEvent = await _context.CalendarEvents
            .Include(e => e.Lead)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (calEvent == null)
        {
            throw new ArgumentException("Calendar event not found");
        }

        calEvent.Status = "COMPLETED";
        await _context.SaveChangesAsync();

        return ConvertToDto(calEvent);
    }

    public async Task DeleteEventAsync(long id, string email)
    {
        var calEvent = await _context.CalendarEvents.FirstOrDefaultAsync(e => e.Id == id);
        if (calEvent == null)
        {
            throw new ArgumentException("Calendar event not found");
        }

        _context.CalendarEvents.Remove(calEvent);
        await _context.SaveChangesAsync();
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
