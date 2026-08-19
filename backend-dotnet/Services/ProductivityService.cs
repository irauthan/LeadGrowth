using LeadGrowth.Data;
using LeadGrowth.DTOs;
using LeadGrowth.Models;
using Microsoft.EntityFrameworkCore;

namespace LeadGrowth.Services;

public class ProductivityService : IProductivityService
{
    private readonly LeadGrowthDbContext _context;

    public ProductivityService(LeadGrowthDbContext context)
    {
        _context = context;
    }

    public async Task<List<TeamProductivityDto>> GetTeamProductivityAsync(string email)
    {
        var normalizedEmail = email.Trim().ToLower();
        var actor = await _context.Users
            .Include(u => u.Workspace)
            .FirstOrDefaultAsync(u => u.Email == normalizedEmail);

        if (actor == null)
        {
            throw new KeyNotFoundException("User not found");
        }

        if (actor.WorkspaceId == null)
        {
            throw new InvalidOperationException("User is not associated with a workspace");
        }

        var members = await _context.Users
            .Where(u => u.WorkspaceId == actor.WorkspaceId)
            .ToListAsync();

        var dtos = new List<TeamProductivityDto>();

        foreach (var user in members)
        {
            if (string.Equals("SUSPENDED", user.Status, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            var dto = await CalculateUserProductivityDtoAsync(user);
            dtos.Add(dto);
        }

        return dtos;
    }

    public async Task GenerateDailyScorecardAsync()
    {
        var users = await _context.Users.Include(u => u.Workspace).ToListAsync();
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        foreach (var user in users)
        {
            if (user.WorkspaceId == null || string.Equals("SUSPENDED", user.Status, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            var dto = await CalculateUserProductivityDtoAsync(user);

            var record = await _context.UserProductivities
                .FirstOrDefaultAsync(p => p.WorkspaceId == user.WorkspaceId && p.UserId == user.Id && p.Date == today);

            if (record == null)
            {
                record = new UserProductivity
                {
                    WorkspaceId = user.WorkspaceId.Value,
                    UserId = user.Id,
                    Date = today
                };
                _context.UserProductivities.Add(record);
            }

            record.TasksCompleted = dto.CompletedTasks;
            record.LeadsConverted = dto.CompletedLeads;
            record.Score = (int)dto.Score;

            await _context.SaveChangesAsync();
        }
    }

    public async Task<TeamProductivityDto> CalculateUserProductivityDtoAsync(User u)
    {
        var completedTasksStatuses = new[] { "COMPLETED", "APPROVED", "Completed" };
        var completedTasks = await _context.Tasks
            .CountAsync(t => t.AssignedToId == u.Id && completedTasksStatuses.Contains(t.Status));

        var allTaskStatuses = new[] { "PENDING", "IN_PROGRESS", "COMPLETED", "PENDING_REVIEW", "APPROVED", "REJECTED", "Pending", "In_Progress", "Completed" };
        var totalTasks = await _context.Tasks
            .CountAsync(t => t.AssignedToId == u.Id && allTaskStatuses.Contains(t.Status));

        var completedLeadsStatuses = new[] { "Converted", "CONVERTED" };
        var completedLeads = await _context.Leads
            .CountAsync(l => l.AssignedToId == u.Id && completedLeadsStatuses.Contains(l.Status));

        var allLeadStatuses = new[] { "New", "Interaction", "Contacted", "Qualified", "Converted", "Rejected", "NEW", "INTERACTION", "CONTACTED", "QUALIFIED", "CONVERTED", "REJECTED" };
        var totalLeads = await _context.Leads
            .CountAsync(l => l.AssignedToId == u.Id && allLeadStatuses.Contains(l.Status));

        double conversionRate = totalLeads > 0 ? (double)completedLeads / totalLeads : 0.0;

        double avgResponseTime = 4.0;
        if (completedTasks + completedLeads > 0)
        {
            avgResponseTime = Math.Max(1.0, 4.0 - (0.1 * (completedTasks + completedLeads)));
        }

        double taskScore = totalTasks > 0 ? ((double)completedTasks / totalTasks) * 100 : 0.0;
        double leadScore = totalLeads > 0 ? ((double)completedLeads / totalLeads) * 100 : 0.0;
        double conversionScore = conversionRate * 100;

        double score = 0.0;
        if (totalTasks > 0 && totalLeads > 0)
        {
            score = (taskScore * 0.35) + (leadScore * 0.35) + (conversionScore * 0.30);
        }
        else if (totalTasks > 0)
        {
            score = taskScore;
        }
        else if (totalLeads > 0)
        {
            score = (leadScore * 0.6) + (conversionScore * 0.4);
        }
        else
        {
            score = string.Equals("AVAILABLE", u.AvailabilityStatus, StringComparison.OrdinalIgnoreCase) ? 50.0 : 30.0;
        }

        score = Math.Round(score * 10.0) / 10.0;
        score = Math.Min(100.0, Math.Max(0.0, score));

        var category = "Needs Improvement";
        if (score >= 80.0)
        {
            category = "Top Performer";
        }
        else if (score >= 50.0)
        {
            category = "Average Performer";
        }

        return new TeamProductivityDto
        {
            UserId = u.Id,
            FullName = u.FullName,
            CompletedTasks = completedTasks,
            CompletedLeads = completedLeads,
            ConversionRate = conversionRate,
            AverageResponseTime = avgResponseTime,
            Score = score,
            Category = category
        };
    }
}
