using LeadGrowth.DTOs;

namespace LeadGrowth.Services;

public interface IBulkAssignmentService
{
    Task<BulkAssignPreviewResponse> PreviewAutoAssignAsync(List<long> leadIds, long workspaceId, string adminEmail);
    Task<BulkAssignExecutionResult> ExecuteBulkAutoAssignAsync(List<long> leadIds, long workspaceId, string adminEmail, long? jobId = null);
    Task<BulkAssignExecutionResult> ExecuteBulkManualAssignAsync(List<long> leadIds, long targetUserId, long workspaceId, string? overrideReason, string adminEmail);
    Task<BulkAssignmentJobDto> CreateScheduledJobAsync(BulkScheduleJobRequest request, long workspaceId, string adminEmail);
    Task<List<BulkAssignmentJobDto>> GetScheduledJobsAsync(long workspaceId, string adminEmail);
    Task CancelScheduledJobAsync(long jobId, long workspaceId, string adminEmail);
    Task ProcessDueScheduledJobsAsync(CancellationToken cancellationToken = default);
}
