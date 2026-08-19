using LeadGrowth.DTOs;
using LeadGrowth.Models;

namespace LeadGrowth.Services;

public interface ILeadService
{
    Task<List<LeadDto>> GetLeadsAsync(string userEmail);
    Task<LeadDto> CreateLeadAsync(LeadDto dto, string userEmail);
    Task<LeadDto> GetLeadByIdAsync(long leadId);
    Task<LeadDto> UpdateStatusAsync(long leadId, string status, string userEmail);
    Task<LeadDto> AssignLeadAsync(long leadId, long userId, string userEmail);
    Task<List<LeadDto>> BulkAssignLeadsAsync(List<long> leadIds, long userId, string userEmail);
    Task<List<LeadDto>> BulkRandomAssignLeadsAsync(List<long> leadIds, string userEmail);
    Task<List<LeadDto>> BulkUpdateLeadStatusAsync(List<long> leadIds, string status, string userEmail);
    Task AddNoteAsync(long leadId, LeadNoteRequest request, string userEmail);
    Task<List<LeadNote>> GetNotesAsync(long leadId);
    Task<LeadDto> AddToPipelineAsync(long leadId, string userEmail);
    Task<List<LeadDto>> GetPipelineLeadsAsync(string userEmail);
    Task<List<LeadDto>> GetPendingAssignedLeadsAsync(string userEmail);
    Task<LeadDto> UpdateLeadActivityAsync(long leadId, string activityKey, string status, string? remarks, string userEmail);
    Task<LeadDto> AddStepActivityLogAsync(long leadId, string activityKey, AddActivityLogRequest request, string userEmail);
    Task<LeadDto> CompleteWorkflowStepAsync(long leadId, string activityKey, CompleteStepRequest? request, string userEmail);
    Task<List<SalesActivityLogDto>> GetLeadActivityLogsAsync(long leadId);
    Task<Dictionary<string, int>> GetWorkflowPendingCountsAsync(string userEmail);
    Task<LeadDto> UpdateLeadWorkspaceAsync(long leadId, LeadDto dto, string userEmail);
    Task<List<LeadHistoryDto>> GetLeadTimelineAsync(long leadId);
    Task<List<ContactRepoDto>> GetContactsRepositoryAsync(string userEmail);
    Task<List<LeadDto>> GetHighPriorityLeadsAsync(string userEmail);
    Task<List<LeadDto>> GetNewLeadsTodayAsync(string userEmail);
    Task<List<LeadDto>> GetNegotiationLeadsAsync(string userEmail);
}
