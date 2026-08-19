using Microsoft.AspNetCore.SignalR;

namespace LeadGrowth.Hubs;

public class LeadHub : Hub
{
    public async Task JoinWorkspaceGroup(long workspaceId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"Workspace_{workspaceId}");
    }

    public async Task LeaveWorkspaceGroup(long workspaceId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"Workspace_{workspaceId}");
    }

    public async Task JoinUserGroup(long userId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"User_{userId}");
    }

    public async Task LeaveUserGroup(long userId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"User_{userId}");
    }
}
