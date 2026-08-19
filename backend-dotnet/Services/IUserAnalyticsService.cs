namespace LeadGrowth.Services;

public interface IUserAnalyticsService
{
    Task<Dictionary<string, object>> GetUserDashboardKpisAsync(string email, string? period, string? startDate, string? endDate);
    Task<Dictionary<string, object>> GetUserAnalyticsAsync(string email, string? period, string? startDate, string? endDate);
}
