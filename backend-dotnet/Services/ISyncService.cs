using LeadGrowth.Models;

namespace LeadGrowth.Services;

public interface ISyncService
{
    Task SyncWorkspaceAsync(long workspaceId, string platform);
    Task<List<Integration>> GetIntegrationsAsync(string email);
    Task<Integration> ConnectIntegrationAsync(string platform, string apiKey, string email);
    Task<List<SyncLog>> GetSyncLogsAsync(string email);
}
