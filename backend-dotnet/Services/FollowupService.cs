using LeadGrowth.Data;
using LeadGrowth.DTOs;
using LeadGrowth.Models;
using Microsoft.EntityFrameworkCore;

namespace LeadGrowth.Services;

public class FollowupService : IFollowupService
{
    private readonly LeadGrowthDbContext _context;

    public FollowupService(LeadGrowthDbContext context)
    {
        _context = context;
    }

    public async Task<List<Dictionary<string, object>>> GetFollowupsAsync(string userEmail)
    {
        var email = userEmail.Trim().ToLower();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null || user.WorkspaceId == null)
        {
            throw new KeyNotFoundException("User not found");
        }

        var followups = await _context.FollowupReminders
            .Include(f => f.Lead)
            .Include(f => f.AssignedTo)
            .Where(f => f.WorkspaceId == user.WorkspaceId)
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
            .Where(f => f.AssignedToId == userId && (excludeId == null || f.Id != excludeId))
            .Where(f => f.ScheduledAt >= windowStart && f.ScheduledAt <= windowEnd && f.Status != "CANCELLED" && f.Status != "COMPLETED")
            .ToListAsync();

        return new Dictionary<string, object>
        {
            { "hasConflict", conflicts.Count > 0 },
            { "conflictCount", conflicts.Count }
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

        if (!DateTime.TryParse(scheduledAt, out var dt))
        {
            dt = DateTime.UtcNow.AddHours(24);
        }

        var conflictCheck = await CheckConflictAsync(user.Id, dt.ToString("o"), null);
        bool hasConflict = (bool)conflictCheck["hasConflict"];

        if (hasConflict && autoScheduleIfConflict)
        {
            dt = dt.AddMinutes(30);
            hasConflict = false;
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
        await _context.SaveChangesAsync();

        return ConvertToDict(followup);
    }

    public async Task<Dictionary<string, object>> AutoScheduleFollowupAsync(long leadId, string userEmail, string type, string notes)
    {
        var dt = DateTime.UtcNow.AddHours(24);
        return await CreateFollowupAsync(leadId, userEmail, dt.ToString("o"), type, notes, null, null, null, true);
    }

    public async Task<List<Dictionary<string, object>>> BulkAutoScheduleAsync(string userEmail, List<long> leadIds)
    {
        var list = new List<Dictionary<string, object>>();
        foreach (var id in leadIds)
        {
            var res = await AutoScheduleFollowupAsync(id, userEmail, "CALL", "Bulk auto-scheduled follow-up");
            list.Add(res);
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
            throw new ArgumentException("Follow-up not found");
        }

        if (DateTime.TryParse(newScheduledAt, out var dt))
        {
            followup.ScheduledAt = dt;
        }

        followup.Status = "UPCOMING";
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

        followup.Status = "CANCELLED";
        followup.Remarks = reason;
        await _context.SaveChangesAsync();

        return ConvertToDict(followup);
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

        await _context.SaveChangesAsync();
        return ConvertToDict(followup);
    }

    private static Dictionary<string, object> ConvertToDict(FollowupReminder f)
    {
        return new Dictionary<string, object>
        {
            { "id", f.Id },
            { "workspaceId", f.WorkspaceId },
            { "leadId", f.LeadId },
            { "leadName", f.Lead != null ? f.Lead.Name : "Unknown" },
            { "assignedToId", f.AssignedToId ?? 0 },
            { "assignedToName", f.AssignedTo != null ? f.AssignedTo.FullName : "Unassigned" },
            { "scheduledAt", f.ScheduledAt.ToString("o") },
            { "type", f.Type },
            { "notes", f.Notes ?? "" },
            { "status", f.Status },
            { "conflictFlag", f.ConflictFlag },
            { "outcome", f.Outcome ?? "" },
            { "remarks", f.Remarks ?? "" },
            { "createdAt", f.CreatedAt.ToString("o") }
        };
    }
}
