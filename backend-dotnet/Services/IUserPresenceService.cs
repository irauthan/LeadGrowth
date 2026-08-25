using LeadGrowth.DTOs;

namespace LeadGrowth.Services;

public interface IUserPresenceService
{
    Task<UserPresenceDto> GetUserPresenceAndWorkloadAsync(long userId);
    Task<UserPresenceDto> GetUserPresenceAndWorkloadByEmailAsync(string email);
    Task<List<UserPresenceDto>> GetWorkspaceTeamPresenceAsync(long workspaceId);
    Task<UserPresenceDto> RequestManualBusyAsync(long userId, ManualBusyRequest request, string actorEmail, bool isAdminOverride = false);
    Task<UserPresenceDto> RequestBreakAsync(long userId, BreakRequest request, string actorEmail);
    Task<UserPresenceDto> RequestAvailableAsync(long userId, string actorEmail);
    Task<UserPresenceDto> AdminUpdateUserStatusAsync(AdminStatusOverrideRequest request, string adminEmail);
    Task RecordHeartbeatAsync(long userId);
    Task RecordHeartbeatByEmailAsync(string email);
    Task ReconcileExpiredStatusesAsync(CancellationToken cancellationToken = default);
    Task<(double Score, string Status, int ActiveLeads, int ValidFollowups)> CalculateUserWorkloadAsync(long userId, long workspaceId, int maxCapacity = 30);
}
