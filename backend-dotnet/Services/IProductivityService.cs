using LeadGrowth.DTOs;
using LeadGrowth.Models;

namespace LeadGrowth.Services;

public interface IProductivityService
{
    Task<List<TeamProductivityDto>> GetTeamProductivityAsync(string email);
    Task GenerateDailyScorecardAsync();
    Task<TeamProductivityDto> CalculateUserProductivityDtoAsync(User user);
}
