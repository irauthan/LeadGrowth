using System.Text.RegularExpressions;
using LeadGrowth.Data;
using LeadGrowth.DTOs;
using LeadGrowth.Models;
using Microsoft.EntityFrameworkCore;

namespace LeadGrowth.Services;

public class UserPresenceService : IUserPresenceService
{
    private readonly LeadGrowthDbContext _context;
    private readonly IWebSocketManagerService _webSocketService;
    private readonly ILogger<UserPresenceService> _logger;

    // Configurable thresholds & defaults
    public const int DefaultMaxActiveLeads = 30;
    public const int DefaultMaxDailyFollowups = 15;
    public const double AutoBusyThreshold = 70.0;
    public const int HeartbeatTimeoutMinutes = 3;
    public const int MaxBreakDurationMinutes = 30;
    public const int MaxDailyBusyMinutes = 180;
    public const int MaxDailyBreakMinutes = 60;

    private static readonly HashSet<string> TerminalLeadStatuses = new(StringComparer.OrdinalIgnoreCase)
    {
        "CONVERTED", "CLOSED WON", "WON", "REJECTED", "CLOSED LOST", "LOST",
        "CLOSED", "DELETED", "ARCHIVED", "DROPPED", "LEAD_LOST", "LEAD LOST"
    };

    public UserPresenceService(
        LeadGrowthDbContext context,
        IWebSocketManagerService webSocketService,
        ILogger<UserPresenceService> logger)
    {
        _context = context;
        _webSocketService = webSocketService;
        _logger = logger;
    }

    public async Task<UserPresenceDto> GetUserPresenceAndWorkloadAsync(long userId)
    {
        var user = await _context.Users
            .Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
        {
            throw new KeyNotFoundException($"User not found with ID {userId}");
        }

        return await BuildUserPresenceDtoAsync(user);
    }

    public async Task<UserPresenceDto> GetUserPresenceAndWorkloadByEmailAsync(string email)
    {
        var normalizedEmail = email.Trim().ToLower();
        var user = await _context.Users
            .Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.Email == normalizedEmail);

        if (user == null)
        {
            throw new KeyNotFoundException($"User not found with email {email}");
        }

        return await BuildUserPresenceDtoAsync(user);
    }

    public async Task<List<UserPresenceDto>> GetWorkspaceTeamPresenceAsync(long workspaceId)
    {
        var users = await _context.Users
            .Include(u => u.Roles)
            .Where(u => u.WorkspaceId == workspaceId && !string.Equals("SUSPENDED", u.Status))
            .ToListAsync();

        var userIdsSet = new HashSet<long>(users.Select(u => u.Id));
        var now = DateTime.UtcNow;

        // Batch active leads count per user (excluding terminal statuses)
        var leadsRaw = await _context.Leads.AsNoTracking()
            .Where(l => l.WorkspaceId == workspaceId && l.AssignedToId.HasValue)
            .Select(l => new { l.AssignedToId, l.Status })
            .ToListAsync();

        var activeLeadsByUser = leadsRaw
            .Where(l => userIdsSet.Contains(l.AssignedToId!.Value) && (l.Status == null || !TerminalLeadStatuses.Contains(l.Status.Trim())))
            .GroupBy(l => l.AssignedToId!.Value)
            .ToDictionary(g => g.Key, g => g.Count());

        // Batch valid pending followups count per user (distinct LeadIds)
        var followupsRaw = await _context.FollowupReminders.AsNoTracking()
            .Include(f => f.Lead)
            .Where(f => f.WorkspaceId == workspaceId && f.AssignedToId.HasValue)
            .Where(f => f.Status != "COMPLETED" && f.Status != "CANCELLED")
            .Select(f => new { f.AssignedToId, f.LeadId, LeadStatus = f.Lead != null ? f.Lead.Status : null })
            .ToListAsync();

        var validFollowupsByUser = followupsRaw
            .Where(f => userIdsSet.Contains(f.AssignedToId!.Value) && (f.LeadStatus == null || !TerminalLeadStatuses.Contains(f.LeadStatus.Trim())))
            .GroupBy(f => f.AssignedToId!.Value)
            .ToDictionary(g => g.Key, g => g.Select(x => x.LeadId).Distinct().Count());

        // Batch active approved leaves
        var activeLeaves = await _context.LeaveRequests
            .Where(l => l.WorkspaceId == workspaceId && l.Status == "APPROVED" && l.StartAtUtc <= now && l.EndAtUtc >= now)
            .Select(l => l.UserId)
            .Distinct()
            .ToListAsync();
        var activeLeaveUserIds = new HashSet<long>(activeLeaves);

        var result = new List<UserPresenceDto>();
        foreach (var u in users)
        {
            int activeLeads = activeLeadsByUser.GetValueOrDefault(u.Id, 0);
            int validFollowups = validFollowupsByUser.GetValueOrDefault(u.Id, 0);
            int maxCap = u.MaxCapacity ?? DefaultMaxActiveLeads;

            double activeLeadRatio = Math.Min((double)activeLeads / maxCap, 1.0);
            double followupRatio = Math.Min((double)validFollowups / DefaultMaxDailyFollowups, 1.0);
            double score = Math.Clamp(Math.Round((activeLeadRatio * 60.0) + (followupRatio * 40.0), 1), 0.0, 100.0);

            string workloadStatus = score >= 90.0 ? "FULL" : (score >= 50.0 ? "HIGH" : "NORMAL");
            bool hasApprovedLeave = activeLeaveUserIds.Contains(u.Id);

            var (effectivePresence, source, reason, expiresAt, isLocked, lockReason) = DetermineEffectivePresence(u, score, hasApprovedLeave, now);

            int? remainingMinutes = null;
            if (expiresAt.HasValue && expiresAt.Value > now)
            {
                remainingMinutes = (int)Math.Ceiling((expiresAt.Value - now).TotalMinutes);
            }

            result.Add(new UserPresenceDto
            {
                UserId = u.Id,
                FullName = u.FullName,
                Email = u.Email,
                Designation = u.Designation,
                Department = u.Department,
                Role = u.Roles.FirstOrDefault()?.Name.Replace("ROLE_", "") ?? "USER",
                EffectivePresence = effectivePresence,
                StatusSource = source,
                StatusReason = reason,
                StatusExpiresAtUtc = expiresAt,
                RemainingMinutes = remainingMinutes,
                IsLocked = isLocked,
                LockReason = lockReason,
                WorkloadScore = score,
                WorkloadStatus = workloadStatus,
                ActiveLeadCount = activeLeads,
                MaxCapacity = maxCap,
                RemainingCapacity = Math.Max(0, maxCap - activeLeads),
                ValidFollowupCount = validFollowups,
                CanReceiveLeads = u.CanReceiveLeads,
                LastHeartbeatAtUtc = u.LastHeartbeatAt,
                LastAssignedAtUtc = u.LastAssignedAt
            });
        }

        return result;
    }

    public async Task<UserPresenceDto> RequestManualBusyAsync(long userId, ManualBusyRequest request, string actorEmail, bool isAdminOverride = false)
    {
        var user = await _context.Users.Include(u => u.Roles).FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) throw new KeyNotFoundException("User not found");

        var actor = await _context.Users.FirstOrDefaultAsync(u => u.Email == actorEmail.Trim().ToLower());
        if (actor == null) throw new KeyNotFoundException("Actor not found");

        // Validate allowed durations: 15, 30, 60 minutes
        int duration = request.DurationMinutes switch
        {
            <= 15 => 15,
            <= 30 => 30,
            _ => 60
        };

        var now = DateTime.UtcNow;

        // Check if on approved leave
        bool isOnLeave = await _context.LeaveRequests.AnyAsync(l => l.UserId == user.Id && l.Status == "APPROVED" && l.StartAtUtc <= now && l.EndAtUtc >= now);
        if (isOnLeave)
        {
            throw new InvalidOperationException("Cannot set status to Busy during an active approved leave.");
        }

        // Daily usage protection (unless admin override)
        if (!isAdminOverride)
        {
            var todayUtc = now.Date;
            var todayLogs = await _context.UserStatusLogs
                .Where(l => l.UserId == user.Id && l.NewStatus == "BUSY" && l.CreatedAtUtc >= todayUtc)
                .ToListAsync();

            int totalTodayMinutes = todayLogs.Sum(l => l.ExpiresAtUtc.HasValue && l.StartedAtUtc.HasValue
                ? (int)(l.ExpiresAtUtc.Value - l.StartedAtUtc.Value).TotalMinutes
                : 0);

            if (totalTodayMinutes + duration > MaxDailyBusyMinutes)
            {
                throw new InvalidOperationException($"Daily manual Busy limit reached ({MaxDailyBusyMinutes} minutes total per day). Please contact your administrator.");
            }
        }

        string sanitizedReason = CleanReason(request.Reason, request.CustomReason);
        var previousStatus = user.AvailabilityStatus;

        user.ManualStatus = "BUSY";
        user.ManualStatusSource = isAdminOverride && actor.Id != user.Id ? "ADMIN" : "USER";
        user.ManualStatusReason = sanitizedReason;
        user.ManualStatusExpiresAt = now.AddMinutes(duration);
        user.AvailabilityStatus = "BUSY";
        user.LastActiveAt = now;
        user.LastHeartbeatAt = now;

        _context.UserStatusLogs.Add(new UserStatusLog
        {
            WorkspaceId = user.WorkspaceId ?? 0,
            UserId = user.Id,
            PreviousStatus = previousStatus,
            NewStatus = "BUSY",
            StatusSource = user.ManualStatusSource,
            Reason = sanitizedReason,
            ChangedById = actor.Id,
            StartedAtUtc = now,
            ExpiresAtUtc = user.ManualStatusExpiresAt,
            CreatedAtUtc = now
        });

        await _context.SaveChangesAsync();

        var dto = await BuildUserPresenceDtoAsync(user);
        if (user.WorkspaceId.HasValue)
        {
            await _webSocketService.BroadcastNotificationAsync(user.Id, new { type = "PRESENCE_CHANGED", presence = dto });
        }

        return dto;
    }

    public async Task<UserPresenceDto> RequestBreakAsync(long userId, BreakRequest request, string actorEmail)
    {
        var user = await _context.Users.Include(u => u.Roles).FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) throw new KeyNotFoundException("User not found");

        var actor = await _context.Users.FirstOrDefaultAsync(u => u.Email == actorEmail.Trim().ToLower());
        if (actor == null) throw new KeyNotFoundException("Actor not found");

        int duration = Math.Clamp(request.DurationMinutes, 5, MaxBreakDurationMinutes);
        var now = DateTime.UtcNow;

        // Check if on approved leave
        bool isOnLeave = await _context.LeaveRequests.AnyAsync(l => l.UserId == user.Id && l.Status == "APPROVED" && l.StartAtUtc <= now && l.EndAtUtc >= now);
        if (isOnLeave)
        {
            throw new InvalidOperationException("Cannot take a break during an active approved leave.");
        }

        // Check daily break limit
        var todayUtc = now.Date;
        var todayBreakLogs = await _context.UserStatusLogs
            .Where(l => l.UserId == user.Id && l.NewStatus == "ON_BREAK" && l.CreatedAtUtc >= todayUtc)
            .ToListAsync();

        int totalBreakMinutes = todayBreakLogs.Sum(l => l.ExpiresAtUtc.HasValue && l.StartedAtUtc.HasValue
            ? (int)(l.ExpiresAtUtc.Value - l.StartedAtUtc.Value).TotalMinutes
            : 0);

        if (totalBreakMinutes + duration > MaxDailyBreakMinutes)
        {
            throw new InvalidOperationException($"Daily break duration limit reached ({MaxDailyBreakMinutes} minutes total per day).");
        }

        var previousStatus = user.AvailabilityStatus;
        string reason = !string.IsNullOrWhiteSpace(request.Reason) ? request.Reason.Trim() : "Short Break";
        if (reason.Length > 100) reason = reason.Substring(0, 100);

        user.ManualStatus = "ON_BREAK";
        user.ManualStatusSource = "USER";
        user.ManualStatusReason = reason;
        user.ManualStatusExpiresAt = now.AddMinutes(duration);
        user.AvailabilityStatus = "ON_BREAK";
        user.LastActiveAt = now;
        user.LastHeartbeatAt = now;

        _context.UserStatusLogs.Add(new UserStatusLog
        {
            WorkspaceId = user.WorkspaceId ?? 0,
            UserId = user.Id,
            PreviousStatus = previousStatus,
            NewStatus = "ON_BREAK",
            StatusSource = "USER",
            Reason = reason,
            ChangedById = actor.Id,
            StartedAtUtc = now,
            ExpiresAtUtc = user.ManualStatusExpiresAt,
            CreatedAtUtc = now
        });

        await _context.SaveChangesAsync();

        var dto = await BuildUserPresenceDtoAsync(user);
        return dto;
    }

    public async Task<UserPresenceDto> RequestAvailableAsync(long userId, string actorEmail)
    {
        var user = await _context.Users.Include(u => u.Roles).FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) throw new KeyNotFoundException("User not found");

        var now = DateTime.UtcNow;

        // Rule: Cannot select AVAILABLE during approved leave
        bool isOnLeave = await _context.LeaveRequests.AnyAsync(l => l.UserId == user.Id && l.Status == "APPROVED" && l.StartAtUtc <= now && l.EndAtUtc >= now);
        if (isOnLeave)
        {
            throw new InvalidOperationException("You currently have an active approved leave. Presence remains 'On Leave' until the leave ends.");
        }

        // Rule: Check current workload
        var (score, _, activeLeads, validFollowups) = await CalculateUserWorkloadAsync(user.Id, user.WorkspaceId ?? 0, user.MaxCapacity ?? DefaultMaxActiveLeads);
        if (score >= AutoBusyThreshold)
        {
            throw new InvalidOperationException($"Your workload score is {score}% ({activeLeads} active leads, {validFollowups} pending follow-ups). System requires completing pending items before returning to Available.");
        }

        var previousStatus = user.AvailabilityStatus;

        // Clear manual Busy / Break
        user.ManualStatus = null;
        user.ManualStatusSource = "USER";
        user.ManualStatusReason = null;
        user.ManualStatusExpiresAt = null;
        user.AvailabilityStatus = "AVAILABLE";
        user.LastActiveAt = now;
        user.LastHeartbeatAt = now;

        _context.UserStatusLogs.Add(new UserStatusLog
        {
            WorkspaceId = user.WorkspaceId ?? 0,
            UserId = user.Id,
            PreviousStatus = previousStatus,
            NewStatus = "AVAILABLE",
            StatusSource = "USER",
            Reason = "User switched to Available",
            ChangedById = user.Id,
            StartedAtUtc = now,
            CreatedAtUtc = now
        });

        await _context.SaveChangesAsync();
        return await BuildUserPresenceDtoAsync(user);
    }

    public async Task<UserPresenceDto> AdminUpdateUserStatusAsync(AdminStatusOverrideRequest request, string adminEmail)
    {
        var admin = await _context.Users.Include(u => u.Roles).FirstOrDefaultAsync(u => u.Email == adminEmail.Trim().ToLower());
        if (admin == null) throw new KeyNotFoundException("Admin not found");

        var targetUser = await _context.Users.Include(u => u.Roles).FirstOrDefaultAsync(u => u.Id == request.TargetUserId);
        if (targetUser == null) throw new KeyNotFoundException("Target user not found");

        if (targetUser.WorkspaceId != admin.WorkspaceId)
        {
            throw new UnauthorizedAccessException("Cannot manage users outside your workspace");
        }

        var cleanReason = string.IsNullOrWhiteSpace(request.Reason) ? "Updated by Administrator" : request.Reason.Trim();

        var now = DateTime.UtcNow;
        var requestedStatus = request.NewStatus.ToUpper();
        var previousStatus = targetUser.AvailabilityStatus;

        if (requestedStatus == "ON_LEAVE")
        {
            throw new InvalidOperationException("On Leave status must be managed via the Leave Request workflow.");
        }

        int? duration = request.DurationMinutes.HasValue && request.DurationMinutes.Value > 0 ? request.DurationMinutes.Value : 60;
        DateTime? expiresAt = (requestedStatus == "BUSY" || requestedStatus == "ON_BREAK") ? now.AddMinutes(duration.Value) : null;

        targetUser.ManualStatus = (requestedStatus == "BUSY" || requestedStatus == "ON_BREAK") ? requestedStatus : null;
        targetUser.ManualStatusSource = "ADMIN";
        targetUser.ManualStatusReason = cleanReason;
        targetUser.ManualStatusExpiresAt = expiresAt;
        targetUser.AvailabilityStatus = requestedStatus;

        _context.UserStatusLogs.Add(new UserStatusLog
        {
            WorkspaceId = targetUser.WorkspaceId ?? 0,
            UserId = targetUser.Id,
            PreviousStatus = previousStatus,
            NewStatus = requestedStatus,
            StatusSource = "ADMIN",
            Reason = cleanReason,
            ChangedById = admin.Id,
            StartedAtUtc = now,
            ExpiresAtUtc = expiresAt,
            CreatedAtUtc = now
        });

        await _context.SaveChangesAsync();
        return await BuildUserPresenceDtoAsync(targetUser);
    }

    public async Task RecordHeartbeatAsync(long userId)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return;

        var now = DateTime.UtcNow;
        // Throttle updates: Only update DB if last heartbeat is older than 30s
        if (user.LastHeartbeatAt == null || (now - user.LastHeartbeatAt.Value).TotalSeconds >= 30)
        {
            user.LastHeartbeatAt = now;
            user.LastActiveAt = now;
            await _context.SaveChangesAsync();
        }
    }

    public async Task RecordHeartbeatByEmailAsync(string email)
    {
        var normalizedEmail = email.Trim().ToLower();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == normalizedEmail);
        if (user != null)
        {
            await RecordHeartbeatAsync(user.Id);
        }
    }

    public async Task ReconcileExpiredStatusesAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;

        // Find users whose manual Busy/Break has expired
        var expiredUsers = await _context.Users
            .Where(u => u.ManualStatusExpiresAt.HasValue && u.ManualStatusExpiresAt.Value <= now)
            .ToListAsync(cancellationToken);

        foreach (var u in expiredUsers)
        {
            var oldStatus = u.AvailabilityStatus;
            u.ManualStatus = null;
            u.ManualStatusExpiresAt = null;
            u.ManualStatusReason = null;
            u.ManualStatusSource = "SYSTEM";

            // Re-evaluate workload score to determine next status
            var (score, _, _, _) = await CalculateUserWorkloadAsync(u.Id, u.WorkspaceId ?? 0, u.MaxCapacity ?? DefaultMaxActiveLeads);
            if (score >= AutoBusyThreshold)
            {
                u.AvailabilityStatus = "BUSY";
            }
            else if (u.LastHeartbeatAt.HasValue && (now - u.LastHeartbeatAt.Value).TotalMinutes <= HeartbeatTimeoutMinutes)
            {
                u.AvailabilityStatus = "AVAILABLE";
            }
            else
            {
                u.AvailabilityStatus = "OFFLINE";
            }

            _context.UserStatusLogs.Add(new UserStatusLog
            {
                WorkspaceId = u.WorkspaceId ?? 0,
                UserId = u.Id,
                PreviousStatus = oldStatus,
                NewStatus = u.AvailabilityStatus,
                StatusSource = "SYSTEM",
                Reason = "Auto-reconciled after Busy/Break expiration",
                StartedAtUtc = now,
                CreatedAtUtc = now
            });
        }

        if (expiredUsers.Count > 0)
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task<(double Score, string Status, int ActiveLeads, int ValidFollowups)> CalculateUserWorkloadAsync(long userId, long workspaceId, int maxCapacity = 30)
    {
        int maxCap = maxCapacity > 0 ? maxCapacity : DefaultMaxActiveLeads;

        // 1. Active assigned non-terminal leads
        var activeLeads = await _context.Leads
            .Where(l => l.WorkspaceId == workspaceId && l.AssignedToId == userId)
            .Where(l => l.Status == null || !TerminalLeadStatuses.Contains(l.Status.Trim()))
            .CountAsync();

        // 2. Valid pending follow-ups linked to active assigned leads (count unique LeadIds!)
        var validFollowups = await _context.FollowupReminders
            .Include(f => f.Lead)
            .Where(f => f.WorkspaceId == workspaceId && f.AssignedToId == userId)
            .Where(f => f.Status != "COMPLETED" && f.Status != "CANCELLED")
            .Where(f => f.Lead != null && (f.Lead.Status == null || !TerminalLeadStatuses.Contains(f.Lead.Status.Trim())))
            .Select(f => f.LeadId)
            .Distinct()
            .CountAsync();

        double activeLeadRatio = Math.Min((double)activeLeads / maxCap, 1.0);
        double followupRatio = Math.Min((double)validFollowups / DefaultMaxDailyFollowups, 1.0);

        // 60% active leads weight + 40% valid followups weight. Scheduler events = 0%.
        double score = Math.Clamp(Math.Round((activeLeadRatio * 60.0) + (followupRatio * 40.0), 1), 0.0, 100.0);
        string status = score >= 90.0 ? "FULL" : (score >= 50.0 ? "HIGH" : "NORMAL");

        return (score, status, activeLeads, validFollowups);
    }

    private async Task<UserPresenceDto> BuildUserPresenceDtoAsync(User user)
    {
        var now = DateTime.UtcNow;
        long wsId = user.WorkspaceId ?? 0;
        int maxCap = user.MaxCapacity ?? DefaultMaxActiveLeads;

        var (score, workloadStatus, activeLeads, validFollowups) = await CalculateUserWorkloadAsync(user.Id, wsId, maxCap);

        bool hasApprovedLeave = await _context.LeaveRequests
            .AnyAsync(l => l.UserId == user.Id && l.Status == "APPROVED" && l.StartAtUtc <= now && l.EndAtUtc >= now);

        var (effectivePresence, source, reason, expiresAt, isLocked, lockReason) = DetermineEffectivePresence(user, score, hasApprovedLeave, now);

        int? remainingMinutes = null;
        if (expiresAt.HasValue && expiresAt.Value > now)
        {
            remainingMinutes = (int)Math.Ceiling((expiresAt.Value - now).TotalMinutes);
        }

        return new UserPresenceDto
        {
            UserId = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Designation = user.Designation,
            Department = user.Department,
            Role = user.Roles.FirstOrDefault()?.Name.Replace("ROLE_", "") ?? "USER",
            EffectivePresence = effectivePresence,
            StatusSource = source,
            StatusReason = reason,
            StatusExpiresAtUtc = expiresAt,
            RemainingMinutes = remainingMinutes,
            IsLocked = isLocked,
            LockReason = lockReason,
            WorkloadScore = score,
            WorkloadStatus = workloadStatus,
            ActiveLeadCount = activeLeads,
            MaxCapacity = maxCap,
            RemainingCapacity = Math.Max(0, maxCap - activeLeads),
            ValidFollowupCount = validFollowups,
            CanReceiveLeads = user.CanReceiveLeads,
            LastHeartbeatAtUtc = user.LastHeartbeatAt,
            LastAssignedAtUtc = user.LastAssignedAt
        };
    }

    private (string EffectivePresence, string Source, string? Reason, DateTime? ExpiresAt, bool IsLocked, string? LockReason)
        DetermineEffectivePresence(User user, double workloadScore, bool hasApprovedLeave, DateTime now)
    {
        // 1. Active approved leave overrides everything
        if (hasApprovedLeave)
        {
            return ("ON_LEAVE", "SYSTEM", "Approved Leave in Progress", null, true, "Locked during active approved leave");
        }

        // 2. Heartbeat check: If heartbeat missing > 3 mins -> OFFLINE
        bool isHeartbeatActive = user.LastHeartbeatAt.HasValue && (now - user.LastHeartbeatAt.Value).TotalMinutes <= HeartbeatTimeoutMinutes;
        if (!isHeartbeatActive && user.AvailabilityStatus == "OFFLINE")
        {
            return ("OFFLINE", "SYSTEM", "No active connection/heartbeat", null, false, null);
        }

        // 3. Active valid break
        if (user.ManualStatus == "ON_BREAK" && user.ManualStatusExpiresAt.HasValue && user.ManualStatusExpiresAt.Value > now)
        {
            return ("ON_BREAK", user.ManualStatusSource ?? "USER", user.ManualStatusReason ?? "Break", user.ManualStatusExpiresAt, false, null);
        }

        // 4. Valid manual Busy
        if (user.ManualStatus == "BUSY" && user.ManualStatusExpiresAt.HasValue && user.ManualStatusExpiresAt.Value > now)
        {
            return ("BUSY", user.ManualStatusSource ?? "USER", user.ManualStatusReason ?? "Focus Work", user.ManualStatusExpiresAt, false, null);
        }

        // 5. System-enforced workload threshold (>= 70)
        if (workloadScore >= AutoBusyThreshold)
        {
            return ("BUSY", "SYSTEM", $"High Workload ({workloadScore}%)", null, true, "System-enforced Busy due to high active lead & follow-up volume");
        }

        // 6. Normal offline if not connected
        if (!isHeartbeatActive)
        {
            return ("OFFLINE", "SYSTEM", "No active connection", null, false, null);
        }

        // 7. Otherwise AVAILABLE
        return ("AVAILABLE", "SYSTEM", null, null, false, null);
    }

    private static string CleanReason(string reason, string? customReason)
    {
        string baseReason = !string.IsNullOrWhiteSpace(reason) ? reason.Trim() : "Focus work";
        if (baseReason.Equals("Other", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrWhiteSpace(customReason))
        {
            baseReason = customReason.Trim();
        }
        // Sanitize: limit to 150 chars
        baseReason = Regex.Replace(baseReason, @"[<>]", "");
        return baseReason.Length > 150 ? baseReason.Substring(0, 150) : baseReason;
    }
}
