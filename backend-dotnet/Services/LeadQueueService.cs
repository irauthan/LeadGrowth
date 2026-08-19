using LeadGrowth.Data;
using LeadGrowth.DTOs;
using LeadGrowth.Models;
using Microsoft.EntityFrameworkCore;

namespace LeadGrowth.Services;

public class LeadQueueService : ILeadQueueService
{
    private readonly LeadGrowthDbContext _context;

    public LeadQueueService(LeadGrowthDbContext context)
    {
        _context = context;
    }

    public async Task<List<LeadDto>> GetUnassignedLeadQueueAsync(long workspaceId)
    {
        var leads = await _context.Leads
            .Include(l => l.AssignedTo)
            .Include(l => l.Campaign)
            .Where(l => l.WorkspaceId == workspaceId)
            .OrderByDescending(l => l.CreatedAt)
            .ToListAsync();

        return leads
            .Where(l => l.AssignedToId == null || string.Equals("IN_QUEUE", l.QueueStatus, StringComparison.OrdinalIgnoreCase))
            .Select(ConvertToDto)
            .ToList();
    }

    public async Task<List<LeadDto>> BulkAssignLeadsAsync(List<long> leadIds, long targetUserId, string actorEmail)
    {
        var email = actorEmail.Trim().ToLower();
        var actor = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (actor == null)
        {
            throw new KeyNotFoundException("Actor not found");
        }

        var targetUser = await _context.Users.FirstOrDefaultAsync(u => u.Id == targetUserId);
        if (targetUser == null)
        {
            throw new KeyNotFoundException("Target user not found");
        }

        var assignedList = new List<LeadDto>();
        foreach (var id in leadIds)
        {
            var lead = await _context.Leads
                .Include(l => l.Workspace)
                .Include(l => l.AssignedTo)
                .Include(l => l.Campaign)
                .FirstOrDefaultAsync(l => l.Id == id);

            if (lead != null && lead.WorkspaceId == actor.WorkspaceId)
            {
                lead.AssignedToId = targetUser.Id;
                lead.AssignedTo = targetUser;
                lead.QueueStatus = "ASSIGNED";
                await _context.SaveChangesAsync();

                var log = new AuditLog
                {
                    WorkspaceId = lead.WorkspaceId,
                    UserId = actor.Id,
                    Action = "LEAD_ASSIGNED",
                    TargetType = "LEAD",
                    TargetId = lead.Id,
                    Description = $"Bulk assigned lead {lead.Name} to {targetUser.FullName}",
                    CreatedAt = DateTime.UtcNow
                };
                _context.AuditLogs.Add(log);
                await _context.SaveChangesAsync();

                assignedList.Add(ConvertToDto(lead));
            }
        }

        return assignedList;
    }

    public async Task<LeadDto> AutoAssignLeadAsync(long leadId, string actorEmail)
    {
        var email = actorEmail.Trim().ToLower();
        var actor = await _context.Users
            .Include(u => u.Workspace)
            .FirstOrDefaultAsync(u => u.Email == email);

        if (actor == null)
        {
            throw new KeyNotFoundException("Actor user not found");
        }

        var lead = await _context.Leads
            .Include(l => l.Workspace)
            .Include(l => l.AssignedTo)
            .Include(l => l.Campaign)
            .FirstOrDefaultAsync(l => l.Id == leadId);

        if (lead == null)
        {
            throw new KeyNotFoundException("Lead not found");
        }

        var bestAssignee = await FindBestAssigneeAsync(actor.WorkspaceId!.Value);

        if (bestAssignee != null)
        {
            lead.AssignedToId = bestAssignee.Id;
            lead.AssignedTo = bestAssignee;
            lead.QueueStatus = "ASSIGNED";
            await _context.SaveChangesAsync();

            bestAssignee.LastAssignedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            var assignment = new LeadAssignment
            {
                LeadId = lead.Id,
                UserId = bestAssignee.Id,
                AssignedAt = DateTime.UtcNow
            };
            _context.LeadAssignments.Add(assignment);

            var assignLog = new AssignmentLog
            {
                WorkspaceId = actor.WorkspaceId.Value,
                LeadId = lead.Id,
                UserId = bestAssignee.Id,
                Strategy = "Auto-Assigned via Hybrid Algorithm (Availability & Workload)",
                AssignedAt = DateTime.UtcNow
            };
            _context.AssignmentLogs.Add(assignLog);

            var auditLog = new AuditLog
            {
                WorkspaceId = actor.WorkspaceId.Value,
                UserId = actor.Id,
                Action = "LEAD_AUTO_ASSIGNED",
                TargetType = "LEAD",
                TargetId = lead.Id,
                Description = $"Auto-assigned lead '{lead.Name}' to {bestAssignee.FullName}",
                CreatedAt = DateTime.UtcNow
            };
            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync();

            return ConvertToDto(lead);
        }
        else
        {
            throw new InvalidOperationException("No available team members currently eligible for auto-assignment.");
        }
    }

    public async Task<LeadDto?> TriggerIdlePreventionSweepAsync(string userEmail)
    {
        var email = userEmail.Trim().ToLower();
        var user = await _context.Users
            .Include(u => u.Workspace)
            .FirstOrDefaultAsync(u => u.Email == email);

        if (user == null)
        {
            throw new KeyNotFoundException("User not found");
        }

        var queue = await _context.Leads
            .Include(l => l.AssignedTo)
            .Include(l => l.Campaign)
            .Where(l => l.AssignedToId == null || string.Equals("IN_QUEUE", l.QueueStatus))
            .OrderByDescending(l => l.CreatedAt)
            .ToListAsync();

        if (queue.Count == 0)
        {
            return null;
        }

        var leadToAssign = queue[0];
        leadToAssign.AssignedToId = user.Id;
        leadToAssign.AssignedTo = user;
        leadToAssign.QueueStatus = "ASSIGNED";
        if (user.WorkspaceId.HasValue)
        {
            leadToAssign.WorkspaceId = user.WorkspaceId.Value;
        }

        await _context.SaveChangesAsync();

        user.LastAssignedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        var assignment = new LeadAssignment
        {
            LeadId = leadToAssign.Id,
            UserId = user.Id,
            AssignedAt = DateTime.UtcNow
        };
        _context.LeadAssignments.Add(assignment);

        if (user.WorkspaceId.HasValue)
        {
            var assignLog = new AssignmentLog
            {
                WorkspaceId = user.WorkspaceId.Value,
                LeadId = leadToAssign.Id,
                UserId = user.Id,
                Strategy = "Assigned via User Idle Prevention Sweep",
                AssignedAt = DateTime.UtcNow
            };
            _context.AssignmentLogs.Add(assignLog);
        }

        await _context.SaveChangesAsync();
        return ConvertToDto(leadToAssign);
    }

    private async Task<User?> FindBestAssigneeAsync(long workspaceId)
    {
        var candidates = await _context.Users
            .Where(u => u.WorkspaceId == workspaceId && !string.Equals("SUSPENDED", u.Status))
            .Where(u => !string.Equals("OFFLINE", u.AvailabilityStatus) && !string.Equals("ON_LEAVE", u.AvailabilityStatus))
            .ToListAsync();

        if (candidates.Count == 0) return null;

        var sorted = candidates
            .OrderByDescending(u => GetAvailabilityScore(u.AvailabilityStatus))
            .ThenBy(u => u.LastAssignedAt ?? DateTime.MinValue)
            .ToList();

        return sorted[0];
    }

    private static int GetAvailabilityScore(string? status)
    {
        if (string.IsNullOrEmpty(status)) return 0;
        return status.ToUpper() switch
        {
            "AVAILABLE" => 3,
            "ON_BREAK" => 2,
            "BUSY" => 1,
            _ => 0
        };
    }

    private static LeadDto ConvertToDto(Lead lead)
    {
        return new LeadDto
        {
            Id = lead.Id,
            Name = lead.Name,
            Email = lead.Email,
            Phone = lead.Phone,
            SourcePlatform = lead.SourcePlatform,
            CampaignName = lead.CampaignName,
            CampaignId = lead.CampaignId,
            Status = lead.Status,
            AssignedToId = lead.AssignedToId,
            AssignedToName = lead.AssignedTo != null ? lead.AssignedTo.FullName : "Unassigned",
            QualityScore = lead.QualityScore ?? 75,
            QualityTier = lead.QualityTier ?? "WARM",
            ConversionProbability = lead.ConversionProbability ?? 75.0,
            QueueStatus = lead.QueueStatus ?? (lead.AssignedToId.HasValue ? "ASSIGNED" : "IN_QUEUE"),
            CreatedAt = lead.CreatedAt
        };
    }
}
