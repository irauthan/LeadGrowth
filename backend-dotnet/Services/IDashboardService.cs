using LeadGrowth.DTOs;

namespace LeadGrowth.Services;

public interface IDashboardService
{
    Task<DashboardKpis> GetDashboardDataAsync(string email, string? period, string? startDate, string? endDate);
    Task<List<SearchResultDto>> SearchGlobalAsync(string query, string email);
}
