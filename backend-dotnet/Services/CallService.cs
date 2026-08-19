using LeadGrowth.Data;
using LeadGrowth.DTOs;
using LeadGrowth.Models;
using Microsoft.EntityFrameworkCore;

namespace LeadGrowth.Services;

public class CallService : ICallService
{
    private readonly LeadGrowthDbContext _context;

    public CallService(LeadGrowthDbContext context)
    {
        _context = context;
    }

    public async Task<CallSessionDto> StartCallAsync(long leadId, string email)
    {
        var userEmail = email.Trim().ToLower();
        var user = await _context.Users
            .Include(u => u.Workspace)
            .FirstOrDefaultAsync(u => u.Email == userEmail);

        if (user == null || user.WorkspaceId == null)
        {
            throw new KeyNotFoundException("User not found");
        }

        var lead = await _context.Leads.FirstOrDefaultAsync(l => l.Id == leadId);
        if (lead == null)
        {
            throw new ArgumentException("Lead not found");
        }

        // Cleanly finish any previous dangling active calls for this user
        var activeCalls = await _context.CallHistories
            .Where(c => c.UserId == user.Id && (c.Status == "ACTIVE" || c.Status == "IN_PROGRESS"))
            .ToListAsync();

        foreach (var activeCall in activeCalls)
        {
            activeCall.Status = "COMPLETED";
            activeCall.EndTime = DateTime.UtcNow;
            var diff = (long)Math.Max(0, (activeCall.EndTime.Value - activeCall.StartTime).TotalSeconds);
            activeCall.DurationSeconds = diff;
            activeCall.DurationMinutes = Math.Round(diff / 60.0, 2);
            activeCall.FormattedDuration = FormatDuration(diff);
            activeCall.UpdatedAt = DateTime.UtcNow;
        }

        if (activeCalls.Count > 0)
        {
            await _context.SaveChangesAsync();
        }

        var newCall = new CallHistory
        {
            WorkspaceId = user.WorkspaceId.Value,
            LeadId = lead.Id,
            UserId = user.Id,
            Status = "ACTIVE",
            StartTime = DateTime.UtcNow,
            DurationSeconds = 0,
            DurationMinutes = 0.0,
            FormattedDuration = "00:00:00",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.CallHistories.Add(newCall);
        await _context.SaveChangesAsync();

        newCall.Lead = lead;
        newCall.User = user;

        return ConvertToDto(newCall);
    }

    public async Task<CallSessionDto> EndCallAsync(long? callId, string email, string? notes)
    {
        var userEmail = email.Trim().ToLower();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == userEmail);
        if (user == null)
        {
            throw new KeyNotFoundException("User not found");
        }

        CallHistory? call = null;
        if (callId.HasValue && callId.Value > 0)
        {
            call = await _context.CallHistories
                .Include(c => c.Lead)
                .Include(c => c.User)
                .FirstOrDefaultAsync(c => c.Id == callId.Value);
        }
        else
        {
            call = await _context.CallHistories
                .Include(c => c.Lead)
                .Include(c => c.User)
                .OrderByDescending(c => c.StartTime)
                .FirstOrDefaultAsync(c => c.UserId == user.Id && (c.Status == "ACTIVE" || c.Status == "IN_PROGRESS"));
        }

        if (call == null)
        {
            throw new ArgumentException("Active call session not found");
        }

        call.Status = "COMPLETED";
        call.EndTime = DateTime.UtcNow;
        var diff = (long)Math.Max(0, (call.EndTime.Value - call.StartTime).TotalSeconds);
        call.DurationSeconds = diff;
        call.DurationMinutes = Math.Round(diff / 60.0, 2);
        call.FormattedDuration = FormatDuration(diff);
        if (!string.IsNullOrEmpty(notes)) call.Notes = notes;
        call.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return ConvertToDto(call);
    }

    public async Task<CallSessionDto?> GetActiveCallAsync(string email)
    {
        var userEmail = email.Trim().ToLower();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == userEmail);
        if (user == null) return null;

        var call = await _context.CallHistories
            .Include(c => c.Lead)
            .Include(c => c.User)
            .OrderByDescending(c => c.StartTime)
            .FirstOrDefaultAsync(c => c.UserId == user.Id && (c.Status == "ACTIVE" || c.Status == "IN_PROGRESS"));

        return call != null ? ConvertToDto(call) : null;
    }

    public async Task<List<CallSessionDto>> GetCallHistoryForLeadAsync(long leadId)
    {
        var calls = await _context.CallHistories
            .Include(c => c.Lead)
            .Include(c => c.User)
            .Where(c => c.LeadId == leadId)
            .OrderByDescending(c => c.StartTime)
            .ToListAsync();

        return calls.Select(ConvertToDto).ToList();
    }

    public async Task<CallAnalyticsDto> GetUserCallAnalyticsAsync(string email)
    {
        var userEmail = email.Trim().ToLower();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == userEmail);
        if (user == null)
        {
            throw new KeyNotFoundException("User not found");
        }

        var calls = await _context.CallHistories
            .Include(c => c.Lead)
            .Include(c => c.User)
            .Where(c => c.UserId == user.Id)
            .OrderByDescending(c => c.StartTime)
            .ToListAsync();

        var activeCall = await GetActiveCallAsync(email);
        var analytics = BuildAnalytics(calls);
        analytics.ActiveCallSession = activeCall;
        return analytics;
    }

    public async Task<CallAnalyticsDto> GetTeamCallAnalyticsAsync(string email)
    {
        var userEmail = email.Trim().ToLower();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == userEmail);
        if (user == null || user.WorkspaceId == null)
        {
            throw new KeyNotFoundException("User workspace not found");
        }

        var calls = await _context.CallHistories
            .Include(c => c.Lead)
            .Include(c => c.User)
            .Where(c => c.WorkspaceId == user.WorkspaceId)
            .OrderByDescending(c => c.StartTime)
            .ToListAsync();

        return BuildAnalytics(calls);
    }

    public async Task<List<CallSessionDto>> GetCallReportsAsync(string email, long? userId, string? startDate, string? endDate)
    {
        var userEmail = email.Trim().ToLower();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == userEmail);
        if (user == null || user.WorkspaceId == null)
        {
            throw new KeyNotFoundException("User workspace not found");
        }

        var query = _context.CallHistories
            .Include(c => c.Lead)
            .Include(c => c.User)
            .Where(c => c.WorkspaceId == user.WorkspaceId);

        if (userId.HasValue)
        {
            query = query.Where(c => c.UserId == userId.Value);
        }

        if (DateTime.TryParse(startDate, out var start))
        {
            query = query.Where(c => c.StartTime >= start);
        }

        if (DateTime.TryParse(endDate, out var end))
        {
            query = query.Where(c => c.StartTime <= end);
        }

        var list = await query.OrderByDescending(c => c.StartTime).ToListAsync();
        return list.Select(ConvertToDto).ToList();
    }

    private static CallAnalyticsDto BuildAnalytics(List<CallHistory> calls)
    {
        var totalCalls = calls.Count;
        var totalDuration = calls.Sum(c => c.DurationSeconds ?? 0);
        var completed = calls.Count(c => c.Status == "COMPLETED");
        var missed = calls.Count(c => c.Status == "MISSED" || c.Status == "CANCELLED");
        var avgDuration = totalCalls > 0 ? (double)totalDuration / totalCalls : 0.0;

        var today = DateTime.UtcNow.Date;
        var todayCalls = calls.Where(c => c.StartTime.Date == today).ToList();
        var todayDuration = todayCalls.Sum(c => c.DurationSeconds ?? 0);
        var longestCall = calls.Count > 0 ? calls.Max(c => c.DurationSeconds ?? 0) : 0;

        return new CallAnalyticsDto
        {
            TotalCalls = totalCalls,
            TotalDurationSeconds = totalDuration,
            AverageDurationSeconds = avgDuration,
            CompletedCalls = completed,
            MissedCalls = missed,
            TodayCallTimeSeconds = todayDuration,
            TodayCallTimeFormatted = FormatDuration(todayDuration),
            TodayCallsCount = todayCalls.Count,
            AvgDurationFormatted = FormatDuration((long)avgDuration),
            LongestCallSeconds = longestCall,
            LongestCallFormatted = FormatDuration(longestCall),
            RecentCalls = calls.Take(10).Select(ConvertToDto).ToList()
        };
    }

    private static string FormatDuration(long totalSeconds)
    {
        var hrs = totalSeconds / 3600;
        var mins = (totalSeconds % 3600) / 60;
        var secs = totalSeconds % 60;
        return $"{hrs:D2}:{mins:D2}:{secs:D2}";
    }

    private static CallSessionDto ConvertToDto(CallHistory c)
    {
        var duration = c.DurationSeconds ?? 0;
        return new CallSessionDto
        {
            Id = c.Id,
            WorkspaceId = c.WorkspaceId,
            LeadId = c.LeadId,
            LeadName = c.Lead != null ? c.Lead.Name : "Unknown",
            LeadPhone = c.Lead != null ? c.Lead.Phone : null,
            LeadCompany = c.Lead != null ? c.Lead.Company : null,
            UserId = c.UserId,
            UserName = c.User != null ? c.User.FullName : "Unknown",
            UserEmail = c.User != null ? c.User.Email : null,
            Status = c.Status,
            DurationSeconds = duration,
            DurationMinutes = c.DurationMinutes ?? Math.Round(duration / 60.0, 2),
            FormattedDuration = c.FormattedDuration ?? FormatDuration(duration),
            StartTime = c.StartTime,
            EndTime = c.EndTime,
            Notes = c.Notes,
            CreatedAt = c.CreatedAt ?? c.StartTime
        };
    }
}

