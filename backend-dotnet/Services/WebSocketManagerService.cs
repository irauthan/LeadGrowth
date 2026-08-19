using LeadGrowth.DTOs;
using LeadGrowth.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace LeadGrowth.Services;

public class WebSocketManagerService : IWebSocketManagerService
{
    private readonly IHubContext<LeadHub> _hubContext;

    public WebSocketManagerService(IHubContext<LeadHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task BroadcastLeadAsync(long workspaceId, LeadDto leadDto)
    {
        await _hubContext.Clients.Group($"Workspace_{workspaceId}").SendAsync("ReceiveLead", leadDto);
    }

    public async Task BroadcastTaskAsync(long workspaceId, object taskDto)
    {
        await _hubContext.Clients.Group($"Workspace_{workspaceId}").SendAsync("ReceiveTask", taskDto);
    }

    public async Task BroadcastNotificationAsync(long userId, object notificationDto)
    {
        await _hubContext.Clients.Group($"User_{userId}").SendAsync("ReceiveNotification", notificationDto);
    }

    public async Task BroadcastWorkspaceNotificationAsync(long workspaceId, object notificationDto)
    {
        await _hubContext.Clients.Group($"Workspace_{workspaceId}").SendAsync("ReceiveWorkspaceNotification", notificationDto);
    }

    public async Task BroadcastCallSessionAsync(long workspaceId, object callSessionDto)
    {
        await _hubContext.Clients.Group($"Workspace_{workspaceId}").SendAsync("ReceiveCallSession", callSessionDto);
    }
}
