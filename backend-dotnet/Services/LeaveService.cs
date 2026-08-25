using LeadGrowth.Data;
using LeadGrowth.DTOs;
using LeadGrowth.Models;
using Microsoft.EntityFrameworkCore;

namespace LeadGrowth.Services;

public class LeaveService : ILeaveService
{
    private readonly LeadGrowthDbContext _context;
    private readonly IUserPresenceService _presenceService;
    private readonly IWebSocketManagerService _webSocketService;

    public LeaveService(
        LeadGrowthDbContext context,
        IUserPresenceService presenceService,
        IWebSocketManagerService webSocketService)
    {
        _context = context;
        _presenceService = presenceService;
        _webSocketService = webSocketService;
    }

    public async Task<LeaveRequestDto> CreateLeaveRequestAsync(LeaveRequestCreateDto dto, string userEmail)
    {
        var normalizedEmail = userEmail.Trim().ToLower();
        var user = await _context.Users
            .Include(u => u.Workspace)
            .FirstOrDefaultAsync(u => u.Email == normalizedEmail);

        if (user == null || !user.WorkspaceId.HasValue)
        {
            throw new KeyNotFoundException("User or workspace not found");
        }

        if (dto.EndAtUtc <= dto.StartAtUtc)
        {
            throw new ArgumentException("Leave end date/time must be after start date/time.");
        }

        if (string.IsNullOrWhiteSpace(dto.Reason))
        {
            throw new ArgumentException("A reason is required for submitting a leave request.");
        }

        // Check for overlapping pending or approved leave for the same user
        bool hasOverlap = await _context.LeaveRequests
            .AnyAsync(l => l.UserId == user.Id
                && (l.Status == "PENDING" || l.Status == "APPROVED")
                && l.StartAtUtc < dto.EndAtUtc
                && l.EndAtUtc > dto.StartAtUtc);

        if (hasOverlap)
        {
            throw new InvalidOperationException("You already have an existing pending or approved leave request overlapping with this time range.");
        }

        var leave = new LeaveRequest
        {
            WorkspaceId = user.WorkspaceId.Value,
            UserId = user.Id,
            StartAtUtc = dto.StartAtUtc,
            EndAtUtc = dto.EndAtUtc,
            Reason = dto.Reason.Trim(),
            Status = "PENDING",
            RequestedAtUtc = DateTime.UtcNow
        };

        _context.LeaveRequests.Add(leave);

        var auditLog = new AuditLog
        {
            WorkspaceId = user.WorkspaceId.Value,
            UserId = user.Id,
            Action = "LEAVE_REQUESTED",
            TargetType = "LEAVE_REQUEST",
            Description = $"User {user.FullName} submitted a leave request from {dto.StartAtUtc:yyyy-MM-dd HH:mm} to {dto.EndAtUtc:yyyy-MM-dd HH:mm} UTC.",
            CreatedAt = DateTime.UtcNow
        };
        _context.AuditLogs.Add(auditLog);

        await _context.SaveChangesAsync();

        return MapToDto(leave, user);
    }

    public async Task<List<LeaveRequestDto>> GetMyLeaveRequestsAsync(string userEmail)
    {
        var normalizedEmail = userEmail.Trim().ToLower();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == normalizedEmail);
        if (user == null) throw new KeyNotFoundException("User not found");

        var leaves = await _context.LeaveRequests
            .Include(l => l.User)
            .Include(l => l.ReviewedBy)
            .Where(l => l.UserId == user.Id)
            .OrderByDescending(l => l.RequestedAtUtc)
            .ToListAsync();

        return leaves.Select(l => MapToDto(l, l.User, l.ReviewedBy)).ToList();
    }

    public async Task<List<LeaveRequestDto>> GetWorkspaceLeaveRequestsAsync(string userEmail)
    {
        var normalizedEmail = userEmail.Trim().ToLower();
        var user = await _context.Users
            .Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.Email == normalizedEmail);

        if (user == null || !user.WorkspaceId.HasValue) throw new KeyNotFoundException("User or workspace not found");

        bool isPrivileged = user.Roles.Any(r => r.Name == "ROLE_ADMIN" || r.Name == "ROLE_MANAGER");
        if (!isPrivileged)
        {
            throw new UnauthorizedAccessException("Only managers and administrators can view all workspace leave requests.");
        }

        var leaves = await _context.LeaveRequests
            .Include(l => l.User)
            .Include(l => l.ReviewedBy)
            .Where(l => l.WorkspaceId == user.WorkspaceId.Value)
            .OrderByDescending(l => l.RequestedAtUtc)
            .ToListAsync();

        return leaves.Select(l => MapToDto(l, l.User, l.ReviewedBy)).ToList();
    }

    public async Task<LeaveRequestDto> ReviewLeaveRequestAsync(long requestId, LeaveRequestReviewDto dto, string reviewerEmail)
    {
        var normalizedEmail = reviewerEmail.Trim().ToLower();
        var reviewer = await _context.Users
            .Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.Email == normalizedEmail);

        if (reviewer == null || !reviewer.WorkspaceId.HasValue)
        {
            throw new KeyNotFoundException("Reviewer not found");
        }

        var leave = await _context.LeaveRequests
            .Include(l => l.User)
            .ThenInclude(u => u!.Roles)
            .FirstOrDefaultAsync(l => l.Id == requestId);

        if (leave == null) throw new KeyNotFoundException("Leave request not found");

        if (leave.WorkspaceId != reviewer.WorkspaceId.Value)
        {
            throw new UnauthorizedAccessException("Cannot review leave requests outside your workspace");
        }

        // Self-approval rule: Users/Admins CANNOT approve their own leave
        if (leave.UserId == reviewer.Id)
        {
            throw new InvalidOperationException("Users and administrators cannot approve or reject their own leave requests. Another authorized administrator must review it.");
        }

        bool isReviewerAdmin = reviewer.Roles.Any(r => r.Name == "ROLE_ADMIN");
        bool isReviewerManager = reviewer.Roles.Any(r => r.Name == "ROLE_MANAGER");

        if (!isReviewerAdmin && !isReviewerManager)
        {
            throw new UnauthorizedAccessException("Insufficient permissions to review leave requests.");
        }

        // If requester is an admin, only another admin can review it
        bool isRequesterAdmin = leave.User?.Roles.Any(r => r.Name == "ROLE_ADMIN") ?? false;
        if (isRequesterAdmin && !isReviewerAdmin)
        {
            throw new UnauthorizedAccessException("Admin leave requests can only be approved by another workspace administrator.");
        }

        leave.Status = dto.Approve ? "APPROVED" : "REJECTED";
        leave.ReviewedAtUtc = DateTime.UtcNow;
        leave.ReviewedById = reviewer.Id;
        leave.ReviewNote = dto.ReviewNote?.Trim();

        // If approved and current time is within leave interval, update availability status to ON_LEAVE
        var now = DateTime.UtcNow;
        if (dto.Approve && leave.StartAtUtc <= now && leave.EndAtUtc >= now && leave.User != null)
        {
            leave.User.AvailabilityStatus = "ON_LEAVE";
            leave.User.ManualStatus = "ON_LEAVE";
            leave.User.ManualStatusSource = "SYSTEM";
            leave.User.ManualStatusReason = "Approved Leave in Progress";
        }

        var auditLog = new AuditLog
        {
            WorkspaceId = leave.WorkspaceId,
            UserId = reviewer.Id,
            Action = dto.Approve ? "LEAVE_APPROVED" : "LEAVE_REJECTED",
            TargetType = "LEAVE_REQUEST",
            TargetId = leave.Id,
            Description = $"Leave request #{leave.Id} for {leave.User?.FullName} was {(dto.Approve ? "APPROVED" : "REJECTED")} by {reviewer.FullName}.",
            CreatedAt = DateTime.UtcNow
        };
        _context.AuditLogs.Add(auditLog);

        await _context.SaveChangesAsync();

        var resultDto = MapToDto(leave, leave.User, reviewer);

        // Broadcast notification to workspace
        await _webSocketService.BroadcastNotificationAsync(leave.UserId, new
        {
            type = "LEAVE_STATUS_CHANGED",
            leave = resultDto
        });

        return resultDto;
    }

    public async Task CancelLeaveRequestAsync(long requestId, string userEmail)
    {
        var normalizedEmail = userEmail.Trim().ToLower();
        var user = await _context.Users
            .Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.Email == normalizedEmail);

        if (user == null) throw new KeyNotFoundException("User not found");

        var leave = await _context.LeaveRequests
            .Include(l => l.User)
            .FirstOrDefaultAsync(l => l.Id == requestId);

        if (leave == null) throw new KeyNotFoundException("Leave request not found");

        bool isAdmin = user.Roles.Any(r => r.Name == "ROLE_ADMIN");
        if (leave.UserId != user.Id && !isAdmin)
        {
            throw new UnauthorizedAccessException("You can only cancel your own leave requests.");
        }

        leave.Status = "CANCELLED";

        // If user was ON_LEAVE, recalculate status
        var now = DateTime.UtcNow;
        if (leave.User != null && leave.StartAtUtc <= now && leave.EndAtUtc >= now)
        {
            if (leave.User.AvailabilityStatus == "ON_LEAVE")
            {
                leave.User.AvailabilityStatus = "AVAILABLE";
                leave.User.ManualStatus = null;
            }
        }

        var auditLog = new AuditLog
        {
            WorkspaceId = leave.WorkspaceId,
            UserId = user.Id,
            Action = "LEAVE_CANCELLED",
            TargetType = "LEAVE_REQUEST",
            TargetId = leave.Id,
            Description = $"Leave request #{leave.Id} was cancelled by {user.FullName}.",
            CreatedAt = DateTime.UtcNow
        };
        _context.AuditLogs.Add(auditLog);

        await _context.SaveChangesAsync();
    }

    private static LeaveRequestDto MapToDto(LeaveRequest leave, User? user, User? reviewer = null)
    {
        return new LeaveRequestDto
        {
            Id = leave.Id,
            WorkspaceId = leave.WorkspaceId,
            UserId = leave.UserId,
            UserName = user?.FullName ?? "Unknown",
            UserEmail = user?.Email ?? "",
            StartAtUtc = leave.StartAtUtc,
            EndAtUtc = leave.EndAtUtc,
            Reason = leave.Reason,
            Status = leave.Status,
            RequestedAtUtc = leave.RequestedAtUtc,
            ReviewedAtUtc = leave.ReviewedAtUtc,
            ReviewedById = leave.ReviewedById,
            ReviewedByName = reviewer?.FullName ?? leave.ReviewedBy?.FullName,
            ReviewNote = leave.ReviewNote
        };
    }
}
