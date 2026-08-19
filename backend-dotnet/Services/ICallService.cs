using LeadGrowth.DTOs;

namespace LeadGrowth.Services;

public interface ICallService
{
    Task<CallSessionDto> StartCallAsync(long leadId, string email);
    Task<CallSessionDto> EndCallAsync(long? callId, string email, string? notes);
    Task<CallSessionDto?> GetActiveCallAsync(string email);
    Task<List<CallSessionDto>> GetCallHistoryForLeadAsync(long leadId);
    Task<CallAnalyticsDto> GetUserCallAnalyticsAsync(string email);
    Task<CallAnalyticsDto> GetTeamCallAnalyticsAsync(string email);
    Task<List<CallSessionDto>> GetCallReportsAsync(string email, long? userId, string? startDate, string? endDate);
}
