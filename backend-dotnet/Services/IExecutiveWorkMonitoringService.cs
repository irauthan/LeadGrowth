using LeadGrowth.DTOs;

namespace LeadGrowth.Services;

public interface IExecutiveWorkMonitoringService
{
    Task<ExecutiveWorkSummaryDto> GetExecutiveWorkSummaryAsync(string actorEmail, long? userId, string timeframe, string? startDate, string? endDate);
}
