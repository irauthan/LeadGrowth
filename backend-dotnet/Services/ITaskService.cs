using LeadGrowth.DTOs;
using LeadGrowth.Models;

namespace LeadGrowth.Services;

public interface ITaskService
{
    Task<List<TaskDto>> GetTasksAsync(string userEmail);
    Task<List<TaskDto>> GetTodayTasksAsync(string userEmail);
    Task<List<TaskDto>> GetCompletedTasksAsync(string userEmail);
    Task<List<TaskDto>> GetOverdueTasksAsync(string userEmail);
    Task<TaskDto> CreateTaskAsync(TaskDto dto, string userEmail);
    Task<TaskDto> ConvertLeadToTaskAsync(long leadId, string? customTitle, string userEmail);
    Task<TaskDto> UpdateTaskStatusAsync(long taskId, string status, string userEmail);
    Task DeleteTaskAsync(long taskId, string userEmail);
    Task<List<TaskDto>> BulkAssignTasksAsync(List<long> taskIds, long userId, string userEmail);
    Task<List<TaskDto>> BulkRandomAssignTasksAsync(List<long> taskIds, string userEmail);
    Task<List<TaskDto>> BulkUpdateStatusAsync(List<long> taskIds, string status, string userEmail);
    Task<TaskDto> AutoAssignTaskAsync(long taskId, string userEmail);
    Task<TaskDto> ApproveTaskAsync(long taskId, string userEmail);
    Task<TaskDto> RejectTaskAsync(long taskId, string userEmail);
    Task<TaskDto> SuspendTaskAsync(long taskId, string userEmail);
    Task<TaskDto> ReassignTaskAsync(long taskId, long userId, string userEmail);
    Task<TaskDto> RescheduleTaskAsync(long taskId, RescheduleTaskRequest request, string userEmail);
    Task HandleUserOfflineAsync(long userId);
}
