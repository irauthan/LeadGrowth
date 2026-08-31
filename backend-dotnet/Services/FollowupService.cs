using LeadGrowth.Data;
using LeadGrowth.DTOs;
using LeadGrowth.Models;
using Microsoft.EntityFrameworkCore;

namespace LeadGrowth.Services;

public class FollowupService : IFollowupService
{
    private readonly LeadGrowthDbContext _context;
    private readonly IWebSocketManagerService _webSocketManager;

    public FollowupService(LeadGrowthDbContext context, IWebSocketManagerService webSocketManager)
    {
        _context = context;
        _webSocketManager = webSocketManager;
    }

    public async Task<List<Dictionary<string, object>>> GetFollowupsAsync(string userEmail, string? period = null, string? startDate = null, string? endDate = null)
    {
        var email = userEmail.Trim().ToLower();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null || user.WorkspaceId == null)
        {
            throw new KeyNotFoundException("User not found");
        }

        var (rangeStart, rangeEnd) = DateRangeHelper.ParsePeriodRange(period, startDate, endDate);
        var isFiltered = !string.IsNullOrWhiteSpace(period) && !"all".Equals(period, StringComparison.OrdinalIgnoreCase);

        var query = _context.FollowupReminders
            .Include(f => f.Lead)
            .Include(f => f.AssignedTo)
            .Where(f => f.WorkspaceId == user.WorkspaceId);

        if (isFiltered)
        {
            query = query.Where(f => (f.ScheduledAt >= rangeStart && f.ScheduledAt <= rangeEnd) || (f.CreatedAt >= rangeStart && f.CreatedAt <= rangeEnd));
        }

        var followups = await query
            .OrderByDescending(f => f.ScheduledAt)
            .ToListAsync();

        return followups.Select(ConvertToDict).ToList();
    }

    public async Task<List<Dictionary<string, object>>> GetTodayFollowupsAsync(string userEmail)
    {
        var all = await GetFollowupsAsync(userEmail);
        var today = DateTime.UtcNow.Date;
        return all.Where(f => f.ContainsKey("scheduledAt") && DateTime.TryParse(f["scheduledAt"]?.ToString(), out var dt) && dt.Date == today).ToList();
    }

    public async Task<Dictionary<string, object>> CheckConflictAsync(long userId, string scheduledAt, long? excludeId)
    {
        if (!DateTime.TryParse(scheduledAt, out var dt))
        {
            return new Dictionary<string, object> { { "hasConflict", false } };
        }

        var windowStart = dt.AddMinutes(-15);
        var windowEnd = dt.AddMinutes(15);

        var conflicts = await _context.FollowupReminders
            .Include(f => f.Lead)
            .Where(f => f.AssignedToId == userId && (excludeId == null || f.Id != excludeId))
            .Where(f => f.ScheduledAt >= windowStart && f.ScheduledAt <= windowEnd && f.Status != "CANCELLED" && f.Status != "COMPLETED")
            .ToListAsync();

        string? conflictingLeadName = conflicts.Count > 0 && conflicts[0].Lead != null ? conflicts[0].Lead.Name : null;
        string? conflictingTime = conflicts.Count > 0 ? conflicts[0].ScheduledAt.ToString("o") : null;

        // Compute suggested free slot
        string? suggestedSlot = null;
        if (conflicts.Count > 0)
        {
            var candidate = dt.AddMinutes(30);
            while (conflicts.Any(c => Math.Abs((c.ScheduledAt - candidate).TotalMinutes) < 15))
            {
                candidate = candidate.AddMinutes(30);
            }
            if (candidate.Hour >= 9 && candidate.Hour < 19)
            {
                suggestedSlot = candidate.ToString("o");
            }
        }

        return new Dictionary<string, object>
        {
            { "hasConflict", conflicts.Count > 0 },
            { "conflictCount", conflicts.Count },
            { "conflictingLeadName", conflictingLeadName ?? "" },
            { "conflictingTime", conflictingTime ?? "" },
            { "suggestedSlot", suggestedSlot ?? "" }
        };
    }

    public async Task<Dictionary<string, object>> CreateFollowupAsync(long leadId, string userEmail, string scheduledAt, string type, string notes, string? outcome, string? nextFollowupDate, string? remarks, bool autoScheduleIfConflict)
    {
        var email = userEmail.Trim().ToLower();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null || user.WorkspaceId == null)
        {
            throw new KeyNotFoundException("User not found");
        }

        var lead = await _context.Leads.FirstOrDefaultAsync(l => l.Id == leadId);
        if (lead == null)
        {
            throw new ArgumentException("Lead not found");
        }

        if (lead.WorkspaceId != user.WorkspaceId)
        {
            throw new UnauthorizedAccessException("Cannot schedule follow-up for a lead in another workspace.");
        }

        var terminalStatuses = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "CONVERTED", "CLOSED WON", "WON", "REJECTED", "CLOSED LOST", "LOST",
            "CLOSED", "DELETED", "ARCHIVED", "DROPPED", "LEAD_LOST", "LEAD LOST"
        };

        if (lead.Status != null && terminalStatuses.Contains(lead.Status.Trim()))
        {
            throw new InvalidOperationException($"Cannot schedule a follow-up for a terminal/closed lead (Status: {lead.Status}).");
        }

        // P3 RULE: Check if an active follow-up already exists for this lead
        var existingActive = await _context.FollowupReminders
            .FirstOrDefaultAsync(f => f.LeadId == leadId && f.Status != "COMPLETED" && f.Status != "CANCELLED");

        if (existingActive != null)
        {
            throw new InvalidOperationException($"409 Conflict: An active follow-up for '{lead.Name}' is already scheduled for {existingActive.ScheduledAt:dd MMM, hh:mm tt}. You must complete or reschedule the existing follow-up before scheduling a new one.");
        }

        if (!DateTime.TryParse(scheduledAt, out var dt))
        {
            dt = DateTime.UtcNow.AddHours(24);
        }

        var conflictCheck = await CheckConflictAsync(lead.AssignedToId ?? user.Id, dt.ToString("o"), null);
        bool hasConflict = (bool)conflictCheck["hasConflict"];

        if (hasConflict)
        {
            if (autoScheduleIfConflict)
            {
                // Auto-advance to next free slot
                var candidate = dt.AddMinutes(30);
                for (int i = 0; i < 20; i++)
                {
                    var check = await CheckConflictAsync(lead.AssignedToId ?? user.Id, candidate.ToString("o"), null);
                    if (!(bool)check["hasConflict"] && candidate.Hour >= 9 && candidate.Hour < 19)
                    {
                        dt = candidate;
                        hasConflict = false;
                        break;
                    }
                    candidate = candidate.AddMinutes(30);
                }
            }
            else
            {
                var conflictLead = conflictCheck["conflictingLeadName"]?.ToString();
                throw new InvalidOperationException($"This time slot ({dt:hh:mm tt}) is already booked for another lead {(string.IsNullOrEmpty(conflictLead) ? "" : $"('{conflictLead}')")}. You cannot schedule multiple leads at the same time.");
            }
        }

        var followup = new FollowupReminder
        {
            WorkspaceId = user.WorkspaceId.Value,
            Workspace = user.Workspace!,
            LeadId = lead.Id,
            Lead = lead,
            AssignedToId = lead.AssignedToId ?? user.Id,
            ScheduledAt = dt,
            Type = !string.IsNullOrWhiteSpace(type) ? type : "CALL",
            Notes = notes,
            Status = "UPCOMING",
            ConflictFlag = hasConflict,
            Outcome = outcome,
            Remarks = remarks,
            CreatedAt = DateTime.UtcNow
        };

        _context.FollowupReminders.Add(followup);

        lead.LastFollowupDate = DateTime.UtcNow;
        if (!string.IsNullOrWhiteSpace(notes))
        {
            lead.ClientNotes = notes;
        }

        var notifUserId = lead.AssignedToId ?? user.Id;
        var notif = new Notification
        {
            UserId = notifUserId,
            Title = "Follow-up Scheduled",
            Message = $"Follow-up ({followup.Type}) scheduled for '{lead.Name}' on {dt:dd MMM, hh:mm tt}.",
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };
        _context.Notifications.Add(notif);

        await _context.SaveChangesAsync();

        try
        {
            await _webSocketManager.BroadcastNotificationAsync(notifUserId, notif);
        }
        catch {}

        return ConvertToDict(followup);
    }

    public async Task<Dictionary<string, object>> AutoScheduleFollowupAsync(long leadId, string userEmail, string type, string notes)
    {
        var dt = DateTime.UtcNow.AddHours(24);
        if (dt.Hour < 9) dt = dt.Date.AddHours(10);
        if (dt.Hour >= 19) dt = dt.Date.AddDays(1).AddHours(10);
        return await CreateFollowupAsync(leadId, userEmail, dt.ToString("o"), type, notes, null, null, null, true);
    }

    public async Task<List<Dictionary<string, object>>> BulkAutoScheduleAsync(string userEmail, List<long> leadIds)
    {
        var list = new List<Dictionary<string, object>>();
        foreach (var id in leadIds)
        {
            try
            {
                var res = await AutoScheduleFollowupAsync(id, userEmail, "CALL", "Bulk auto-scheduled follow-up");
                list.Add(res);
            }
            catch (Exception)
            {
                // Skip leads that already have active followups or cannot be scheduled
            }
        }
        return list;
    }

    public async Task<Dictionary<string, object>> RescheduleFollowupAsync(long id, string userEmail, string newScheduledAt, bool autoScheduleIfConflict)
    {
        var followup = await _context.FollowupReminders
            .Include(f => f.Lead)
            .Include(f => f.AssignedTo)
            .FirstOrDefaultAsync(f => f.Id == id);

        if (followup == null)
        {
            throw new ArgumentException("Follow-up reminder not found");
        }

        if (!DateTime.TryParse(newScheduledAt, out var dt))
        {
            throw new ArgumentException("Invalid new scheduled date format");
        }

        // P2 RULE: Conflict check excluding this followup
        var conflictCheck = await CheckConflictAsync(followup.AssignedToId ?? 0, dt.ToString("o"), followup.Id);
        bool hasConflict = (bool)conflictCheck["hasConflict"];

        if (hasConflict)
        {
            if (autoScheduleIfConflict)
            {
                var candidate = dt.AddMinutes(30);
                for (int i = 0; i < 20; i++)
                {
                    var check = await CheckConflictAsync(followup.AssignedToId ?? 0, candidate.ToString("o"), followup.Id);
                    if (!(bool)check["hasConflict"] && candidate.Hour >= 9 && candidate.Hour < 19)
                    {
                        dt = candidate;
                        hasConflict = false;
                        break;
                    }
                    candidate = candidate.AddMinutes(30);
                }
            }
            else
            {
                var conflictLead = conflictCheck["conflictingLeadName"]?.ToString();
                throw new InvalidOperationException($"This time slot ({dt:hh:mm tt}) is already booked for {(string.IsNullOrEmpty(conflictLead) ? "another lead" : $"lead '{conflictLead}'")}. Please choose a free slot.");
            }
        }

        followup.ScheduledAt = dt;
        if (followup.Lead != null)
        {
            followup.Lead.LastFollowupDate = DateTime.UtcNow;
        }

        followup.Status = "UPCOMING";

        if (followup.AssignedToId.HasValue && followup.AssignedToId.Value > 0)
        {
            var reschedNotif = new Notification
            {
                UserId = followup.AssignedToId.Value,
                Title = "Follow-up Rescheduled",
                Message = $"Follow-up for '{followup.Lead?.Name ?? "Lead"}' rescheduled to {dt:dd MMM, hh:mm tt}.",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };
            _context.Notifications.Add(reschedNotif);
        }

        await _context.SaveChangesAsync();

        return ConvertToDict(followup);
    }

    public async Task<Dictionary<string, object>> CancelFollowupAsync(long id, string userEmail, string reason)
    {
        var followup = await _context.FollowupReminders
            .Include(f => f.Lead)
            .Include(f => f.AssignedTo)
            .FirstOrDefaultAsync(f => f.Id == id);

        if (followup == null)
        {
            throw new ArgumentException("Follow-up not found");
        }

        if (followup.Lead != null)
        {
            followup.Lead.LastFollowupDate = DateTime.UtcNow;
        }

        // Remove the reminder from database so it is completely removed and slot is free
        _context.FollowupReminders.Remove(followup);
        await _context.SaveChangesAsync();

        return new Dictionary<string, object>
        {
            { "id", id },
            { "status", "CANCELLED" },
            { "message", "Follow-up removed and time slot freed successfully." }
        };
    }

    public async Task<Dictionary<string, object>> ReassignFollowupAsync(long id, long newUserId, string? newScheduledAt)
    {
        var followup = await _context.FollowupReminders
            .Include(f => f.Lead)
            .Include(f => f.AssignedTo)
            .FirstOrDefaultAsync(f => f.Id == id);

        if (followup == null)
        {
            throw new ArgumentException("Follow-up not found");
        }

        var newAssignee = await _context.Users.FirstOrDefaultAsync(u => u.Id == newUserId);
        if (newAssignee == null)
        {
            throw new ArgumentException("Target user not found");
        }

        followup.AssignedToId = newAssignee.Id;
        followup.AssignedTo = newAssignee;

        if (DateTime.TryParse(newScheduledAt, out var dt))
        {
            followup.ScheduledAt = dt;
            if (followup.Lead != null)
            {
                followup.Lead.LastFollowupDate = DateTime.UtcNow;
            }
        }

        await _context.SaveChangesAsync();
        return ConvertToDict(followup);
    }

    public async Task<Dictionary<string, object>> CompleteFollowupAsync(long id, string userEmail, string notes)
    {
        var followup = await _context.FollowupReminders
            .Include(f => f.Lead)
            .Include(f => f.AssignedTo)
            .FirstOrDefaultAsync(f => f.Id == id);

        if (followup == null)
        {
            throw new ArgumentException("Follow-up not found");
        }

        followup.Status = "COMPLETED";
        if (!string.IsNullOrWhiteSpace(notes))
        {
            followup.Remarks = notes;
        }

        if (followup.Lead != null)
        {
            followup.Lead.LastFollowupDate = DateTime.UtcNow;
            if (!string.IsNullOrWhiteSpace(notes))
            {
                followup.Lead.ClientNotes = notes;
            }
        }

        await _context.SaveChangesAsync();
        return ConvertToDict(followup);
    }

    private static Dictionary<string, object> ConvertToDict(FollowupReminder f)
    {
        bool isOverdue = (f.Status == "UPCOMING" || f.Status == "PENDING" || f.Status == "SCHEDULED") && f.ScheduledAt < DateTime.UtcNow;
        return new Dictionary<string, object>
        {
            { "id", f.Id },
            { "workspaceId", f.WorkspaceId },
            { "leadId", f.LeadId },
            { "leadName", f.Lead != null ? f.Lead.Name : "Unknown" },
            { "leadEmail", f.Lead != null ? (f.Lead.Email ?? "") : "" },
            { "leadPhone", f.Lead != null ? (f.Lead.Phone ?? "") : "" },
            { "leadStage", f.Lead != null ? (f.Lead.Status ?? "Interaction") : "Interaction" },
            { "leadPriority", f.Lead != null ? (f.Lead.Priority ?? "MEDIUM") : "MEDIUM" },
            { "assignedToId", f.AssignedToId ?? (f.Lead?.AssignedToId ?? 0) },
            { "assignedToName", f.AssignedTo != null ? f.AssignedTo.FullName : (f.Lead?.AssignedTo?.FullName ?? "Unassigned") },
            { "scheduledAt", f.ScheduledAt.ToString("o") },
            { "type", f.Type },
            { "notes", f.Notes ?? "" },
            { "status", isOverdue && f.Status == "UPCOMING" ? "OVERDUE" : f.Status },
            { "conflictFlag", f.ConflictFlag },
            { "isOverdue", isOverdue },
            { "outcome", f.Outcome ?? "" },
            { "remarks", f.Remarks ?? "" },
            { "createdAt", f.CreatedAt.ToString("o") }
        };
    }
}
