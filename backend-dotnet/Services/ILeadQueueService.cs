using LeadGrowth.DTOs;

namespace LeadGrowth.Services;

public interface ILeadQueueService
{
    Task<List<LeadDto>> GetUnassignedLeadQueueAsync(long workspaceId);
    Task<List<LeadDto>> BulkAssignLeadsAsync(List<long> leadIds, long targetUserId, string actorEmail);
    Task<LeadDto> AutoAssignLeadAsync(long leadId, string actorEmail);
    Task<LeadDto?> TriggerIdlePreventionSweepAsync(string userEmail);
}
