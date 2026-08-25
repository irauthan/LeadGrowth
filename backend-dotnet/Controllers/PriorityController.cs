using System.Security.Claims;
using LeadGrowth.Data;
using LeadGrowth.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LeadGrowth.Controllers;

public class PriorityStatsDto
{
    public int TodaysWorkCount { get; set; }
    public int OverdueCount { get; set; }
    public int HighPriorityCount { get; set; }
    public int TodaysFollowupsCount { get; set; }
    public int NegotiationsCount { get; set; }
    public int NewLeadsCount { get; set; }
    public int CompletedTodayCount { get; set; }
}

public class PriorityItemDto
{
    public long LeadId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Company { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string SourcePlatform { get; set; } = string.Empty;
    public string CurrentStage { get; set; } = "New";
    public int? QualityScore { get; set; }
    public string? QualityTier { get; set; }
    public double? ConversionProbability { get; set; }
    public string PriorityLevel { get; set; } = "P5_TODAY_NEW_LEAD";
    public string PriorityLabel { get; set; } = "High Urgency";
    public string? DueDate { get; set; }
    public string? DueTime { get; set; }
    public string UrgencyReason { get; set; } = string.Empty;
    public long? AssignedToId { get; set; }
    public string? AssignedToName { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? LastActivityDescription { get; set; }
}

[ApiController]
[Route("api/priority")]
[Authorize]
public class PriorityController : ControllerBase
{
    private readonly LeadGrowthDbContext _context;

    public PriorityController(LeadGrowthDbContext context)
    {
        _context = context;
    }

    [HttpGet("stats")]
    public async Task<ActionResult<PriorityStatsDto>> GetPriorityStats()
    {
        var email = GetUserEmail();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null || !user.WorkspaceId.HasValue)
        {
            return BadRequest(new { message = "User workspace not found" });
        }

        var workspaceId = user.WorkspaceId.Value;
        var today = DateTime.UtcNow.Date;
        var tomorrow = today.AddDays(1);

        var leads = await _context.Leads
            .Where(l => l.WorkspaceId == workspaceId)
            .ToListAsync();

        var followups = await _context.FollowupReminders
            .Where(f => f.WorkspaceId == workspaceId)
            .ToListAsync();

        var tasks = await _context.Tasks
            .Where(t => t.WorkspaceId == workspaceId)
            .ToListAsync();

        var overdueFollowups = followups.Count(f => 
            (f.Status == "PENDING" || f.Status == "OVERDUE") && 
            f.ScheduledAt < DateTime.UtcNow);

        var todayDateOnly = DateOnly.FromDateTime(today);
        var overdueTasks = tasks.Count(t => 
            (t.Status == "Pending" || t.Status == "In_Progress" || t.Status == "PENDING" || t.Status == "IN_PROGRESS") && 
            t.DueDate.HasValue && t.DueDate.Value < todayDateOnly);

        var todaysFollowups = followups.Count(f => 
            f.ScheduledAt >= today && f.ScheduledAt < tomorrow && f.Status != "COMPLETED");

        var negotiations = leads.Count(l => 
            string.Equals(l.Status, "Negotiation", StringComparison.OrdinalIgnoreCase) || 
            string.Equals(l.Status, "Closing", StringComparison.OrdinalIgnoreCase));

        var newLeads = leads.Count(l => 
            string.Equals(l.Status, "New", StringComparison.OrdinalIgnoreCase) || 
            l.CreatedAt >= today);

        var highPriority = leads.Count(l => 
            string.Equals(l.QualityTier, "HOT", StringComparison.OrdinalIgnoreCase) || 
            string.Equals(l.Priority, "HIGH", StringComparison.OrdinalIgnoreCase) || 
            string.Equals(l.Priority, "URGENT", StringComparison.OrdinalIgnoreCase));

        var completedTasksToday = tasks.Count(t => 
            (t.Status == "Completed" || t.Status == "COMPLETED") && 
            t.CreatedAt >= today);

        var stats = new PriorityStatsDto
        {
            TodaysWorkCount = highPriority + todaysFollowups,
            OverdueCount = overdueFollowups + overdueTasks,
            HighPriorityCount = highPriority,
            TodaysFollowupsCount = todaysFollowups,
            NegotiationsCount = negotiations,
            NewLeadsCount = newLeads,
            CompletedTodayCount = completedTasksToday
        };

        return Ok(stats);
    }

    [HttpGet("leads")]
    public async Task<ActionResult<List<PriorityItemDto>>> GetPriorityLeads()
    {
        var email = GetUserEmail();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null || !user.WorkspaceId.HasValue)
        {
            return BadRequest(new { message = "User workspace not found" });
        }

        var workspaceId = user.WorkspaceId.Value;
        var now = DateTime.UtcNow;
        var today = now.Date;
        var tomorrow = today.AddDays(1);

        var leads = await _context.Leads
            .Include(l => l.AssignedTo)
            .Where(l => l.WorkspaceId == workspaceId && l.Status != "Won" && l.Status != "Lost" && l.Status != "Closed")
            .ToListAsync();

        var followups = await _context.FollowupReminders
            .Where(f => f.WorkspaceId == workspaceId && f.Status != "COMPLETED" && f.Status != "CANCELLED")
            .ToListAsync();

        var priorityList = new List<PriorityItemDto>();

        foreach (var lead in leads)
        {
            var leadFollowups = followups.Where(f => f.LeadId == lead.Id).ToList();
            var overdue = leadFollowups.FirstOrDefault(f => f.ScheduledAt < now);
            var todayFollowup = leadFollowups.FirstOrDefault(f => f.ScheduledAt >= today && f.ScheduledAt < tomorrow);

            string priorityLevel;
            string priorityLabel;
            string urgencyReason;
            string? dueDate = null;
            string? dueTime = null;

            if (overdue != null)
            {
                priorityLevel = "P1_OVERDUE_FOLLOWUP";
                priorityLabel = "P1 • Overdue Follow-up";
                urgencyReason = $"Overdue since {overdue.ScheduledAt.ToString("MMM dd, hh:mm tt")}";
                dueDate = overdue.ScheduledAt.ToString("yyyy-MM-dd");
                dueTime = overdue.ScheduledAt.ToString("hh:mm tt");
            }
            else if (string.Equals(lead.Status, "Negotiation", StringComparison.OrdinalIgnoreCase))
            {
                priorityLevel = "P2_TODAY_NEGOTIATION";
                priorityLabel = "P2 • Negotiation Deal";
                urgencyReason = "High-intent closing deal requiring fast response";
            }
            else if (string.Equals(lead.Status, "Proposal", StringComparison.OrdinalIgnoreCase) || string.Equals(lead.Status, "Demo", StringComparison.OrdinalIgnoreCase))
            {
                priorityLevel = "P3_TODAY_PROPOSAL";
                priorityLabel = "P3 • Proposal / Demo Stage";
                urgencyReason = "Active client review pending decision";
            }
            else if (todayFollowup != null)
            {
                priorityLevel = "P4_TODAY_FOLLOWUP";
                priorityLabel = "P4 • Scheduled Today";
                urgencyReason = $"Scheduled follow-up at {todayFollowup.ScheduledAt.ToString("hh:mm tt")}";
                dueDate = todayFollowup.ScheduledAt.ToString("yyyy-MM-dd");
                dueTime = todayFollowup.ScheduledAt.ToString("hh:mm tt");
            }
            else if (string.Equals(lead.Status, "New", StringComparison.OrdinalIgnoreCase) || lead.CreatedAt >= today.AddDays(-1))
            {
                priorityLevel = "P5_TODAY_NEW_LEAD";
                priorityLabel = "P5 • Fresh Inbound Lead";
                urgencyReason = "New lead awaiting first qualifying call";
            }
            else if (string.Equals(lead.QualityTier, "HOT", StringComparison.OrdinalIgnoreCase) || string.Equals(lead.Priority, "HIGH", StringComparison.OrdinalIgnoreCase))
            {
                priorityLevel = "P2_TODAY_NEGOTIATION";
                priorityLabel = "High Quality Hot Lead";
                urgencyReason = "High priority lead with high conversion score";
            }
            else
            {
                priorityLevel = "P6_ACTIVE_PIPELINE";
                priorityLabel = "P6 • Active Pipeline";
                urgencyReason = "Ongoing nurture & pipeline engagement";
            }

            priorityList.Add(new PriorityItemDto
            {
                LeadId = lead.Id,
                Name = lead.Name,
                Company = lead.Company,
                Email = lead.Email,
                Phone = lead.Phone,
                SourcePlatform = lead.SourcePlatform ?? "Organic",
                CurrentStage = lead.Status,
                QualityScore = lead.QualityScore ?? 75,
                QualityTier = lead.QualityTier ?? "WARM",
                ConversionProbability = lead.ConversionProbability ?? 70.0,
                PriorityLevel = priorityLevel,
                PriorityLabel = priorityLabel,
                DueDate = dueDate,
                DueTime = dueTime,
                UrgencyReason = urgencyReason,
                AssignedToId = lead.AssignedToId,
                AssignedToName = lead.AssignedTo?.FullName ?? "Unassigned",
                CreatedAt = lead.CreatedAt,
                LastActivityDescription = lead.ClientNotes
            });
        }

        var rankOrder = new Dictionary<string, int>
        {
            { "P1_OVERDUE_FOLLOWUP", 1 },
            { "P2_TODAY_NEGOTIATION", 2 },
            { "P3_TODAY_PROPOSAL", 3 },
            { "P4_TODAY_FOLLOWUP", 4 },
            { "P5_TODAY_NEW_LEAD", 5 },
            { "P6_ACTIVE_PIPELINE", 6 }
        };

        var sorted = priorityList
            .OrderBy(p => rankOrder.TryGetValue(p.PriorityLevel, out var rank) ? rank : 99)
            .ThenByDescending(p => p.QualityScore ?? 0)
            .ToList();

        return Ok(sorted);
    }

    private string GetUserEmail()
    {
        return User.FindFirstValue(ClaimTypes.Name) ?? User.FindFirstValue(ClaimTypes.Email) ?? string.Empty;
    }
}
