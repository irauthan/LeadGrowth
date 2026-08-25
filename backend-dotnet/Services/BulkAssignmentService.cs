using System.Text.Json;
using LeadGrowth.Data;
using LeadGrowth.DTOs;
using LeadGrowth.Models;
using Microsoft.EntityFrameworkCore;

namespace LeadGrowth.Services;

public class BulkAssignmentService : IBulkAssignmentService
{
    private readonly LeadGrowthDbContext _context;
    private readonly IUserPresenceService _presenceService;
    private readonly IWebSocketManagerService _webSocketService;
    private readonly ILogger<BulkAssignmentService> _logger;

    public BulkAssignmentService(
        LeadGrowthDbContext context,
        IUserPresenceService presenceService,
        IWebSocketManagerService webSocketService,
        ILogger<BulkAssignmentService> logger)
    {
        _context = context;
        _presenceService = presenceService;
        _webSocketService = webSocketService;
        _logger = logger;
    }

    public async Task<BulkAssignPreviewResponse> PreviewAutoAssignAsync(List<long> leadIds, long workspaceId, string adminEmail)
    {
        var distinctLeadIds = leadIds.Distinct().ToList();

        // 1. Fetch available leads in this workspace
        var leads = await _context.Leads
            .Where(l => l.WorkspaceId == workspaceId && distinctLeadIds.Contains(l.Id))
            .ToListAsync();

        int totalSelected = leads.Count;

        // 2. Fetch team presence
        var teamPresence = await _presenceService.GetWorkspaceTeamPresenceAsync(workspaceId);

        var eligible = new List<EligibleUserPreviewDto>();
        var excluded = new List<ExcludedUserPreviewDto>();

        foreach (var member in teamPresence)
        {
            if (!member.CanReceiveLeads)
            {
                excluded.Add(new ExcludedUserPreviewDto
                {
                    UserId = member.UserId,
                    FullName = member.FullName,
                    Email = member.Email,
                    Role = member.Role,
                    PresenceStatus = member.EffectivePresence,
                    WorkloadStatus = member.WorkloadStatus,
                    ActiveLeadCount = member.ActiveLeadCount,
                    MaxCapacity = member.MaxCapacity,
                    Reason = "Lead reception is disabled (CanReceiveLeads is false)"
                });
                continue;
            }

            if (member.EffectivePresence == "ON_LEAVE")
            {
                excluded.Add(new ExcludedUserPreviewDto
                {
                    UserId = member.UserId,
                    FullName = member.FullName,
                    Email = member.Email,
                    Role = member.Role,
                    PresenceStatus = member.EffectivePresence,
                    WorkloadStatus = member.WorkloadStatus,
                    ActiveLeadCount = member.ActiveLeadCount,
                    MaxCapacity = member.MaxCapacity,
                    Reason = "User is on active approved leave"
                });
                continue;
            }

            if (member.EffectivePresence == "OFFLINE")
            {
                excluded.Add(new ExcludedUserPreviewDto
                {
                    UserId = member.UserId,
                    FullName = member.FullName,
                    Email = member.Email,
                    Role = member.Role,
                    PresenceStatus = member.EffectivePresence,
                    WorkloadStatus = member.WorkloadStatus,
                    ActiveLeadCount = member.ActiveLeadCount,
                    MaxCapacity = member.MaxCapacity,
                    Reason = "User is offline / heartbeat inactive"
                });
                continue;
            }

            if (member.EffectivePresence == "ON_BREAK")
            {
                excluded.Add(new ExcludedUserPreviewDto
                {
                    UserId = member.UserId,
                    FullName = member.FullName,
                    Email = member.Email,
                    Role = member.Role,
                    PresenceStatus = member.EffectivePresence,
                    WorkloadStatus = member.WorkloadStatus,
                    ActiveLeadCount = member.ActiveLeadCount,
                    MaxCapacity = member.MaxCapacity,
                    Reason = "User is currently on break"
                });
                continue;
            }

            if (member.EffectivePresence == "BUSY")
            {
                excluded.Add(new ExcludedUserPreviewDto
                {
                    UserId = member.UserId,
                    FullName = member.FullName,
                    Email = member.Email,
                    Role = member.Role,
                    PresenceStatus = member.EffectivePresence,
                    WorkloadStatus = member.WorkloadStatus,
                    ActiveLeadCount = member.ActiveLeadCount,
                    MaxCapacity = member.MaxCapacity,
                    Reason = string.IsNullOrWhiteSpace(member.StatusReason) ? "User is busy" : $"User is busy ({member.StatusReason})"
                });
                continue;
            }

            if (member.WorkloadStatus == "FULL" || member.RemainingCapacity <= 0)
            {
                excluded.Add(new ExcludedUserPreviewDto
                {
                    UserId = member.UserId,
                    FullName = member.FullName,
                    Email = member.Email,
                    Role = member.Role,
                    PresenceStatus = member.EffectivePresence,
                    WorkloadStatus = member.WorkloadStatus,
                    ActiveLeadCount = member.ActiveLeadCount,
                    MaxCapacity = member.MaxCapacity,
                    Reason = "User has reached maximum lead capacity"
                });
                continue;
            }

            // Eligible
            eligible.Add(new EligibleUserPreviewDto
            {
                UserId = member.UserId,
                FullName = member.FullName,
                Email = member.Email,
                Role = member.Role,
                PresenceStatus = member.EffectivePresence,
                CurrentWorkloadScore = member.WorkloadScore,
                CurrentWorkloadStatus = member.WorkloadStatus,
                CurrentActiveLeads = member.ActiveLeadCount,
                MaxCapacity = member.MaxCapacity,
                RemainingCapacity = member.RemainingCapacity,
                ProjectedAssignedCount = 0,
                ProjectedWorkloadScore = member.WorkloadScore,
                ProjectedWorkloadStatus = member.WorkloadStatus,
                LastAssignedAt = member.LastAssignedAtUtc
            });
        }

        int totalEligibleCapacity = eligible.Sum(e => e.RemainingCapacity);

        // 3. Simulate Fair Distribution Algorithm
        var projectedAllocations = new Dictionary<long, int>();
        foreach (var e in eligible) projectedAllocations[e.UserId] = 0;

        for (int i = 0; i < totalSelected; i++)
        {
            // Pick candidate with remaining capacity, lowest projected workload score, lowest active leads, oldest lastAssignedAt, stable userId
            var candidate = eligible
                .Where(e => projectedAllocations[e.UserId] < e.RemainingCapacity)
                .OrderBy(e => CalculateSimulatedWorkloadScore(e, projectedAllocations[e.UserId]))
                .ThenBy(e => e.CurrentActiveLeads + projectedAllocations[e.UserId])
                .ThenBy(e => e.LastAssignedAt ?? DateTime.MinValue)
                .ThenBy(e => e.UserId)
                .FirstOrDefault();

            if (candidate == null)
            {
                // Total capacity reached; remaining leads stay unassigned
                break;
            }

            projectedAllocations[candidate.UserId]++;
        }

        foreach (var e in eligible)
        {
            e.ProjectedAssignedCount = projectedAllocations[e.UserId];
            e.ProjectedWorkloadScore = CalculateSimulatedWorkloadScore(e, e.ProjectedAssignedCount);
            e.ProjectedWorkloadStatus = e.ProjectedWorkloadScore >= 90.0 ? "FULL" : (e.ProjectedWorkloadScore >= 50.0 ? "HIGH" : "NORMAL");
        }

        int projectedAssigned = eligible.Sum(e => e.ProjectedAssignedCount);
        int projectedUnassigned = totalSelected - projectedAssigned;

        return new BulkAssignPreviewResponse
        {
            TotalSelectedLeads = totalSelected,
            TotalEligibleCapacity = totalEligibleCapacity,
            ProjectedAssignedLeads = projectedAssigned,
            ProjectedUnassignedLeads = projectedUnassigned,
            EligibleUsers = eligible,
            ExcludedUsers = excluded
        };
    }

    public async Task<BulkAssignExecutionResult> ExecuteBulkAutoAssignAsync(List<long> leadIds, long workspaceId, string adminEmail, long? jobId = null)
    {
        var distinctLeadIds = leadIds.Distinct().ToList();
        var admin = await _context.Users.FirstOrDefaultAsync(u => u.Email == adminEmail.Trim().ToLower());
        if (admin == null) throw new KeyNotFoundException("Admin not found");

        var leads = await _context.Leads
            .Include(l => l.Campaign)
            .Where(l => l.WorkspaceId == workspaceId && distinctLeadIds.Contains(l.Id))
            .ToListAsync();

        if (leads.Count == 0)
        {
            return new BulkAssignExecutionResult
            {
                JobId = jobId,
                TotalLeads = 0,
                AssignedCount = 0,
                UnassignedCount = 0,
                Status = "COMPLETED"
            };
        }

        // Fetch team presence
        var teamPresence = await _presenceService.GetWorkspaceTeamPresenceAsync(workspaceId);

        // Filter eligible users at execution time
        var eligibleUsers = teamPresence
            .Where(m => m.CanReceiveLeads
                && m.EffectivePresence == "AVAILABLE"
                && m.WorkloadStatus != "FULL"
                && m.RemainingCapacity > 0)
            .Select(m => new EligibleUserPreviewDto
            {
                UserId = m.UserId,
                FullName = m.FullName,
                Email = m.Email,
                Role = m.Role,
                PresenceStatus = m.EffectivePresence,
                CurrentWorkloadScore = m.WorkloadScore,
                CurrentActiveLeads = m.ActiveLeadCount,
                MaxCapacity = m.MaxCapacity,
                RemainingCapacity = m.RemainingCapacity,
                ProjectedAssignedCount = 0,
                LastAssignedAt = m.LastAssignedAtUtc
            })
            .ToList();

        if (eligibleUsers.Count == 0)
        {
            return new BulkAssignExecutionResult
            {
                JobId = jobId,
                TotalLeads = leads.Count,
                AssignedCount = 0,
                UnassignedCount = leads.Count,
                Status = "PARTIALLY_COMPLETED",
                FailureSummary = "No eligible team members were available with capacity at execution time. All leads remain safely unassigned."
            };
        }

        var assignedList = new List<LeadDto>();
        var userAssignmentCounts = new Dictionary<string, int>();
        foreach (var u in eligibleUsers) userAssignmentCounts[u.FullName] = 0;

        var currentAllocations = new Dictionary<long, int>();
        foreach (var u in eligibleUsers) currentAllocations[u.UserId] = 0;

        var now = DateTime.UtcNow;

        // Perform fair assignment lead by lead
        foreach (var lead in leads)
        {
            // Skip already assigned leads if any
            if (lead.AssignedToId.HasValue && lead.QueueStatus != "IN_QUEUE")
            {
                continue;
            }

            var candidate = eligibleUsers
                .Where(u => currentAllocations[u.UserId] < u.RemainingCapacity)
                .OrderBy(u => CalculateSimulatedWorkloadScore(u, currentAllocations[u.UserId]))
                .ThenBy(u => u.CurrentActiveLeads + currentAllocations[u.UserId])
                .ThenBy(u => u.LastAssignedAt ?? DateTime.MinValue)
                .ThenBy(u => u.UserId)
                .FirstOrDefault();

            if (candidate == null)
            {
                // Capacity exhausted; remaining leads stay safely in queue
                break;
            }

            var targetUserEntity = await _context.Users.FirstOrDefaultAsync(u => u.Id == candidate.UserId);
            if (targetUserEntity == null) continue;

            lead.AssignedToId = targetUserEntity.Id;
            lead.AssignedTo = targetUserEntity;
            lead.AssignedById = admin.Id;
            lead.AssignedDate = now;
            lead.QueueStatus = "ASSIGNED";

            targetUserEntity.LastAssignedAt = now;

            currentAllocations[candidate.UserId]++;
            userAssignmentCounts[candidate.FullName]++;

            _context.LeadAssignments.Add(new LeadAssignment
            {
                LeadId = lead.Id,
                UserId = targetUserEntity.Id,
                AssignedAt = now
            });

            _context.LeadAssignmentHistories.Add(new LeadAssignmentHistory
            {
                LeadId = lead.Id,
                AssignedById = admin.Id,
                AssignedToId = targetUserEntity.Id,
                Reason = "Bulk Auto-Assignment via Fair Distribution Engine",
                AssignedAt = now
            });

            _context.Notifications.Add(new Notification
            {
                UserId = targetUserEntity.Id,
                Title = "New Lead Assigned",
                Message = $"You have been assigned lead '{lead.Name}' via Admin Bulk Auto-Assign.",
                IsRead = false,
                CreatedAt = now
            });

            assignedList.Add(ConvertToDto(lead));
        }

        int assignedCount = assignedList.Count;
        int unassignedCount = leads.Count - assignedCount;

        string executionStatus = unassignedCount == 0 ? "COMPLETED" : "PARTIALLY_COMPLETED";
        string? failureSummary = unassignedCount > 0
            ? $"Total eligible capacity was {eligibleUsers.Sum(u => u.RemainingCapacity)}. {assignedCount} leads were assigned and {unassignedCount} leads remain safely unassigned in the queue."
            : null;

        var auditLog = new AuditLog
        {
            WorkspaceId = workspaceId,
            UserId = admin.Id,
            Action = "BULK_AUTO_ASSIGN_EXECUTED",
            TargetType = "LEADS",
            Description = $"Bulk Auto-Assign completed: {assignedCount} assigned, {unassignedCount} unassigned.",
            CreatedAt = now
        };
        _context.AuditLogs.Add(auditLog);

        await _context.SaveChangesAsync();

        // Broadcast realtime SignalR updates
        await _webSocketService.BroadcastWorkspaceNotificationAsync(workspaceId, new
        {
            type = "BULK_ASSIGNMENT_COMPLETED",
            assignedCount,
            unassignedCount,
            status = executionStatus
        });

        return new BulkAssignExecutionResult
        {
            JobId = jobId,
            TotalLeads = leads.Count,
            AssignedCount = assignedCount,
            UnassignedCount = unassignedCount,
            Status = executionStatus,
            AssignedLeads = assignedList,
            UserAssignmentCounts = userAssignmentCounts,
            FailureSummary = failureSummary
        };
    }

    public async Task<BulkAssignExecutionResult> ExecuteBulkManualAssignAsync(List<long> leadIds, long targetUserId, long workspaceId, string? overrideReason, string adminEmail)
    {
        var distinctLeadIds = leadIds.Distinct().ToList();
        var admin = await _context.Users.FirstOrDefaultAsync(u => u.Email == adminEmail.Trim().ToLower());
        if (admin == null) throw new KeyNotFoundException("Admin not found");

        var targetUser = await _context.Users
            .Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.Id == targetUserId);

        if (targetUser == null) throw new KeyNotFoundException("Target user not found");

        if (targetUser.WorkspaceId != workspaceId)
        {
            throw new UnauthorizedAccessException("Target user does not belong to this workspace");
        }

        if (string.Equals("SUSPENDED", targetUser.Status, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Cannot assign leads to a suspended user account.");
        }

        var presence = await _presenceService.GetUserPresenceAndWorkloadAsync(targetUser.Id);
        bool isNonOptimal = presence.EffectivePresence != "AVAILABLE" || presence.WorkloadStatus == "FULL";

        var leads = await _context.Leads
            .Include(l => l.Campaign)
            .Where(l => l.WorkspaceId == workspaceId && distinctLeadIds.Contains(l.Id))
            .ToListAsync();

        var assignedList = new List<LeadDto>();
        var now = DateTime.UtcNow;

        foreach (var lead in leads)
        {
            lead.AssignedToId = targetUser.Id;
            lead.AssignedTo = targetUser;
            lead.AssignedById = admin.Id;
            lead.AssignedDate = now;
            lead.QueueStatus = "ASSIGNED";

            _context.LeadAssignments.Add(new LeadAssignment
            {
                LeadId = lead.Id,
                UserId = targetUser.Id,
                AssignedAt = now
            });

            _context.LeadAssignmentHistories.Add(new LeadAssignmentHistory
            {
                LeadId = lead.Id,
                AssignedById = admin.Id,
                AssignedToId = targetUser.Id,
                Reason = isNonOptimal
                    ? $"Manual Assignment Override (User was {presence.EffectivePresence}, Workload: {presence.WorkloadStatus}). Reason: {overrideReason ?? "Admin manual assignment"}"
                    : "Manual Assignment",
                AssignedAt = now
            });

            _context.Notifications.Add(new Notification
            {
                UserId = targetUser.Id,
                Title = "New Lead Assigned",
                Message = $"You have been manually assigned lead '{lead.Name}' by {admin.FullName}.",
                IsRead = false,
                CreatedAt = now
            });

            assignedList.Add(ConvertToDto(lead));
        }

        targetUser.LastAssignedAt = now;

        var auditLog = new AuditLog
        {
            WorkspaceId = workspaceId,
            UserId = admin.Id,
            Action = "BULK_MANUAL_ASSIGN_EXECUTED",
            TargetType = "LEADS",
            TargetId = targetUser.Id,
            Description = $"Bulk assigned {assignedList.Count} leads to {targetUser.FullName}." + (isNonOptimal ? $" Override reason: {overrideReason ?? "None provided"}" : ""),
            CreatedAt = now
        };
        _context.AuditLogs.Add(auditLog);

        await _context.SaveChangesAsync();

        var counts = new Dictionary<string, int> { { targetUser.FullName, assignedList.Count } };

        return new BulkAssignExecutionResult
        {
            TotalLeads = leads.Count,
            AssignedCount = assignedList.Count,
            UnassignedCount = 0,
            Status = "COMPLETED",
            AssignedLeads = assignedList,
            UserAssignmentCounts = counts
        };
    }

    public async Task<BulkAssignmentJobDto> CreateScheduledJobAsync(BulkScheduleJobRequest request, long workspaceId, string adminEmail)
    {
        var admin = await _context.Users.FirstOrDefaultAsync(u => u.Email == adminEmail.Trim().ToLower());
        if (admin == null) throw new KeyNotFoundException("Admin not found");

        if (request.ScheduledAtUtc <= DateTime.UtcNow)
        {
            throw new ArgumentException("Scheduled time must be in the future.");
        }

        if (request.LeadIds.Count == 0)
        {
            throw new ArgumentException("At least one lead must be selected for scheduling.");
        }

        var job = new BulkAssignmentJob
        {
            WorkspaceId = workspaceId,
            CreatedByAdminId = admin.Id,
            AssignmentMethod = request.AssignmentMethod.ToUpper() == "MANUAL" ? "MANUAL" : "AUTO",
            TargetUserId = request.TargetUserId,
            LeadIdsJson = JsonSerializer.Serialize(request.LeadIds),
            ScheduledAtUtc = request.ScheduledAtUtc,
            Status = "PENDING",
            TotalLeadCount = request.LeadIds.Count,
            AssignedCount = 0,
            UnassignedCount = request.LeadIds.Count,
            CreatedAtUtc = DateTime.UtcNow
        };

        _context.BulkAssignmentJobs.Add(job);

        var auditLog = new AuditLog
        {
            WorkspaceId = workspaceId,
            UserId = admin.Id,
            Action = "BULK_JOB_SCHEDULED",
            TargetType = "BULK_JOB",
            Description = $"Admin {admin.FullName} scheduled Bulk {job.AssignmentMethod} Assign for {job.TotalLeadCount} leads at {request.ScheduledAtUtc:yyyy-MM-dd HH:mm} UTC.",
            CreatedAt = DateTime.UtcNow
        };
        _context.AuditLogs.Add(auditLog);

        await _context.SaveChangesAsync();

        return MapJobToDto(job, admin, null);
    }

    public async Task<List<BulkAssignmentJobDto>> GetScheduledJobsAsync(long workspaceId, string adminEmail)
    {
        var jobs = await _context.BulkAssignmentJobs
            .Include(j => j.CreatedByAdmin)
            .Include(j => j.TargetUser)
            .Where(j => j.WorkspaceId == workspaceId)
            .OrderByDescending(j => j.CreatedAtUtc)
            .ToListAsync();

        return jobs.Select(j => MapJobToDto(j, j.CreatedByAdmin, j.TargetUser)).ToList();
    }

    public async Task CancelScheduledJobAsync(long jobId, long workspaceId, string adminEmail)
    {
        var admin = await _context.Users.FirstOrDefaultAsync(u => u.Email == adminEmail.Trim().ToLower());
        if (admin == null) throw new KeyNotFoundException("Admin not found");

        var job = await _context.BulkAssignmentJobs.FirstOrDefaultAsync(j => j.Id == jobId && j.WorkspaceId == workspaceId);
        if (job == null) throw new KeyNotFoundException("Scheduled job not found");

        if (job.Status != "PENDING")
        {
            throw new InvalidOperationException($"Cannot cancel a job with status '{job.Status}'.");
        }

        job.Status = "CANCELLED";

        var auditLog = new AuditLog
        {
            WorkspaceId = workspaceId,
            UserId = admin.Id,
            Action = "BULK_JOB_CANCELLED",
            TargetType = "BULK_JOB",
            TargetId = job.Id,
            Description = $"Admin {admin.FullName} cancelled scheduled Bulk Job #{job.Id}.",
            CreatedAt = DateTime.UtcNow
        };
        _context.AuditLogs.Add(auditLog);

        await _context.SaveChangesAsync();
    }

    public async Task ProcessDueScheduledJobsAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;

        // Fetch pending jobs whose scheduled time is due
        var dueJobs = await _context.BulkAssignmentJobs
            .Include(j => j.CreatedByAdmin)
            .Where(j => j.Status == "PENDING" && j.ScheduledAtUtc.HasValue && j.ScheduledAtUtc.Value <= now)
            .ToListAsync(cancellationToken);

        foreach (var job in dueJobs)
        {
            try
            {
                job.Status = "RUNNING";
                job.StartedAtUtc = DateTime.UtcNow;
                await _context.SaveChangesAsync(cancellationToken);

                var leadIds = JsonSerializer.Deserialize<List<long>>(job.LeadIdsJson) ?? new List<long>();
                string adminEmail = job.CreatedByAdmin?.Email ?? "system@leadgrowth.com";

                BulkAssignExecutionResult result;
                if (job.AssignmentMethod == "MANUAL" && job.TargetUserId.HasValue)
                {
                    result = await ExecuteBulkManualAssignAsync(leadIds, job.TargetUserId.Value, job.WorkspaceId, "Scheduled Manual Assignment Execution", adminEmail);
                }
                else
                {
                    result = await ExecuteBulkAutoAssignAsync(leadIds, job.WorkspaceId, adminEmail, job.Id);
                }

                job.Status = result.Status;
                job.AssignedCount = result.AssignedCount;
                job.UnassignedCount = result.UnassignedCount;
                job.FailureSummary = result.FailureSummary;
                job.CompletedAtUtc = DateTime.UtcNow;

                await _context.SaveChangesAsync(cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing scheduled bulk assignment job #{JobId}", job.Id);
                job.Status = "FAILED";
                job.FailureSummary = ex.Message;
                job.CompletedAtUtc = DateTime.UtcNow;
                await _context.SaveChangesAsync(cancellationToken);
            }
        }
    }

    private static double CalculateSimulatedWorkloadScore(EligibleUserPreviewDto user, int additionalLeads)
    {
        int totalActiveLeads = user.CurrentActiveLeads + additionalLeads;
        double activeLeadRatio = Math.Min((double)totalActiveLeads / user.MaxCapacity, 1.0);
        // Follow-up ratio remains based on current followups
        double currentFollowupContribution = user.CurrentWorkloadScore - (Math.Min((double)user.CurrentActiveLeads / user.MaxCapacity, 1.0) * 60.0);
        currentFollowupContribution = Math.Clamp(currentFollowupContribution, 0.0, 40.0);

        return Math.Clamp(Math.Round((activeLeadRatio * 60.0) + currentFollowupContribution, 1), 0.0, 100.0);
    }

    private static BulkAssignmentJobDto MapJobToDto(BulkAssignmentJob job, User? admin, User? target)
    {
        return new BulkAssignmentJobDto
        {
            Id = job.Id,
            WorkspaceId = job.WorkspaceId,
            CreatedByAdminId = job.CreatedByAdminId,
            CreatedByAdminName = admin?.FullName ?? "Admin",
            AssignmentMethod = job.AssignmentMethod,
            TargetUserId = job.TargetUserId,
            TargetUserName = target?.FullName,
            TotalLeadCount = job.TotalLeadCount,
            AssignedCount = job.AssignedCount,
            UnassignedCount = job.UnassignedCount,
            ScheduledAtUtc = job.ScheduledAtUtc,
            StartedAtUtc = job.StartedAtUtc,
            CompletedAtUtc = job.CompletedAtUtc,
            Status = job.Status,
            FailureSummary = job.FailureSummary,
            CreatedAtUtc = job.CreatedAtUtc
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
