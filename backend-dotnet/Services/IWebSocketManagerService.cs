using LeadGrowth.DTOs;

namespace LeadGrowth.Services;

public interface IWebSocketManagerService
{
    Task BroadcastLeadAsync(long workspaceId, LeadDto leadDto);
    Task BroadcastTaskAsync(long workspaceId, object taskDto);
    Task BroadcastNotificationAsync(long userId, object notificationDto);
    Task BroadcastWorkspaceNotificationAsync(long workspaceId, object notificationDto);
    Task BroadcastCallSessionAsync(long workspaceId, object callSessionDto);
    Task BroadcastPresenceChangedAsync(long workspaceId, object presenceDto);
    Task BroadcastWorkloadChangedAsync(long workspaceId, object workloadDto);
}
