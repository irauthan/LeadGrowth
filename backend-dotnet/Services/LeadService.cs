using LeadGrowth.Data;
using LeadGrowth.DTOs;
using LeadGrowth.Models;
using Microsoft.EntityFrameworkCore;

namespace LeadGrowth.Services;

public class LeadService : ILeadService
{
    private readonly LeadGrowthDbContext _context;

    public LeadService(LeadGrowthDbContext context)
    {
        _context = context;
    }

    public async Task<List<LeadDto>> GetLeadsAsync(string userEmail, string? period = null, string? startDate = null, string? endDate = null)
    {
        var email = userEmail.Trim().ToLower();
        var user = await _context.Users
            .Include(u => u.Workspace)
            .Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.Email == email);

        if (user == null)
        {
            throw new KeyNotFoundException("User not found");
        }

        if (user.WorkspaceId == null)
        {
            throw new InvalidOperationException("User does not belong to a workspace");
        }

        var (rangeStart, rangeEnd) = DateRangeHelper.ParsePeriodRange(period, startDate, endDate);
        var isFiltered = !string.IsNullOrWhiteSpace(period) && !"all".Equals(period, StringComparison.OrdinalIgnoreCase);

        bool isUserOnly = IsUserOnly(user);

        var query = _context.Leads
            .Include(l => l.Workspace)
            .Include(l => l.Campaign)
            .Include(l => l.AssignedTo)
            .Include(l => l.AssignedBy)
            .Where(l => isUserOnly ? l.AssignedToId == user.Id : l.WorkspaceId == user.WorkspaceId);

        if (isFiltered)
        {
            query = query.Where(l => l.CreatedAt >= rangeStart && l.CreatedAt <= rangeEnd);
        }

        var leads = await query.OrderByDescending(l => l.CreatedAt).ToListAsync();

        var dtos = new List<LeadDto>();
        foreach (var l in leads)
        {
            dtos.Add(await ConvertToDtoAsync(l));
        }

        return dtos;
    }

    public async Task<LeadDto> CreateLeadAsync(LeadDto dto, string userEmail)
    {
        var email = userEmail.Trim().ToLower();
        var creator = await _context.Users
            .Include(u => u.Workspace)
            .FirstOrDefaultAsync(u => u.Email == email);

        if (creator == null)
        {
            throw new KeyNotFoundException("User not found");
        }

        Campaign? campaign = null;
        if (dto.CampaignId.HasValue)
        {
            campaign = await _context.Campaigns.FirstOrDefaultAsync(c => c.Id == dto.CampaignId.Value);
        }

        User? assignedTo = null;
        string? algorithmDetails = null;

        if (dto.AssignedToId.HasValue && dto.AssignedToId.Value == -1)
        {
            assignedTo = await FindBestLeadAssigneeAsync(creator.WorkspaceId);
            if (assignedTo != null)
            {
                algorithmDetails = "Assigned via Hybrid Auto-Assignment Lead Algorithm.";
            }
            else
            {
                algorithmDetails = "Auto-Assignment requested but no eligible sales agents available. Kept in Lead Queue.";
            }
        }
        else if (dto.AssignedToId.HasValue && dto.AssignedToId.Value > 0)
        {
            assignedTo = await _context.Users
                .Include(u => u.Roles)
                .FirstOrDefaultAsync(u => u.Id == dto.AssignedToId.Value);

            ValidateLeadAssigneeRole(assignedTo);
            algorithmDetails = "Assigned manually by Creator.";
        }

        var lead = new Lead
        {
            WorkspaceId = creator.WorkspaceId!.Value,
            CampaignId = campaign?.Id,
            Name = dto.Name,
            Email = dto.Email,
            Phone = dto.Phone,
            SourcePlatform = !string.IsNullOrWhiteSpace(dto.SourcePlatform) ? dto.SourcePlatform : "Manual Leads",
            CampaignName = dto.CampaignName,
            Status = "New",
            AssignedToId = assignedTo?.Id,
            Priority = dto.Priority ?? "MEDIUM",
            Company = dto.Company,
            Location = dto.Location,
            ProgressPercentage = 10,
            CreatedAt = DateTime.UtcNow
        };

        _context.Leads.Add(lead);
        await _context.SaveChangesAsync();

        try
        {
            if (campaign != null)
            {
                campaign.LeadsCount += 1;
                await _context.SaveChangesAsync();
            }

            if (assignedTo != null)
            {
                assignedTo.LastAssignedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                var assignment = new LeadAssignment
                {
                    LeadId = lead.Id,
                    UserId = assignedTo.Id,
                    AssignedAt = DateTime.UtcNow
                };
                _context.LeadAssignments.Add(assignment);

                var assignLog = new AssignmentLog
                {
                    WorkspaceId = creator.WorkspaceId.Value,
                    LeadId = lead.Id,
                    UserId = assignedTo.Id,
                    Strategy = algorithmDetails,
                    AssignedAt = DateTime.UtcNow
                };
                _context.AssignmentLogs.Add(assignLog);

                var notification = new Notification
                {
                    UserId = assignedTo.Id,
                    Title = "New Lead Assigned",
                    Message = $"You have been assigned to lead: \"{lead.Name}\" from source \"{lead.SourcePlatform}\".",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                };
                _context.Notifications.Add(notification);
                await _context.SaveChangesAsync();
            }
            else
            {
                var assignLog = new AssignmentLog
                {
                    WorkspaceId = creator.WorkspaceId.Value,
                    LeadId = lead.Id,
                    UserId = creator.Id,
                    Strategy = "Lead added to workspace queue.",
                    AssignedAt = DateTime.UtcNow
                };
                _context.AssignmentLogs.Add(assignLog);
                await _context.SaveChangesAsync();
            }
        }
        catch (Exception ex)
        {
            // Log exception without failing lead creation
            Console.WriteLine($"[LeadService] Non-critical error during post-lead creation logging: {ex.Message}");
        }

        return await ConvertToDtoAsync(lead);
    }

    public async Task<LeadDto> GetLeadByIdAsync(long leadId)
    {
        var lead = await _context.Leads
            .Include(l => l.Workspace)
            .Include(l => l.Campaign)
            .Include(l => l.AssignedTo)
            .Include(l => l.AssignedBy)
            .FirstOrDefaultAsync(l => l.Id == leadId);

        if (lead == null)
        {
            throw new ArgumentException("Lead not found");
        }

        return await ConvertToDtoAsync(lead);
    }

    public async Task<LeadDto> UpdateStatusAsync(long leadId, string status, string userEmail)
    {
        var email = userEmail.Trim().ToLower();
        var user = await _context.Users
            .Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.Email == email);

        if (user == null)
        {
            throw new KeyNotFoundException("User not found");
        }

        var lead = await _context.Leads
            .Include(l => l.Workspace)
            .Include(l => l.Campaign)
            .Include(l => l.AssignedTo)
            .Include(l => l.AssignedBy)
            .FirstOrDefaultAsync(l => l.Id == leadId);

        if (lead == null)
        {
            throw new ArgumentException("Lead not found");
        }

        bool isUserOnly = IsUserOnly(user);

        if (isUserOnly && (lead.AssignedToId == null || lead.AssignedToId != user.Id))
        {
            throw new InvalidOperationException("You are not authorized to update this lead's status");
        }

        var oldStatus = lead.Status ?? "New Lead";
        lead.Status = status;
        lead.ProgressPercentage = CalculateProgressPercentage(status);

        if (("Converted".Equals(status, StringComparison.OrdinalIgnoreCase) || "Closed Won".Equals(status, StringComparison.OrdinalIgnoreCase)) && lead.Campaign != null)
        {
            lead.Campaign.Conversions += 1;
        }

        await _context.SaveChangesAsync();
        await ResolveOverdueFollowupsForLeadAsync(lead, $"Stage updated from '{oldStatus}' to '{status}'");

        return await ConvertToDtoAsync(lead);
    }

    public async Task<LeadDto> AssignLeadAsync(long leadId, long userId, string userEmail)
    {
        var email = userEmail.Trim().ToLower();
        var user = await _context.Users
            .Include(u => u.Workspace)
            .FirstOrDefaultAsync(u => u.Email == email);

        if (user == null)
        {
            throw new KeyNotFoundException("User not found");
        }

        var lead = await _context.Leads
            .Include(l => l.Workspace)
            .Include(l => l.Campaign)
            .Include(l => l.AssignedTo)
            .Include(l => l.AssignedBy)
            .FirstOrDefaultAsync(l => l.Id == leadId);

        if (lead == null)
        {
            throw new ArgumentException("Lead not found");
        }

        User? assignTarget = null;
        string? algorithmDetails = null;

        if (userId == -1)
        {
            assignTarget = await FindBestLeadAssigneeAsync(user.WorkspaceId);
            if (assignTarget != null)
            {
                algorithmDetails = "Assigned via Hybrid Auto-Assignment Lead Algorithm.";
            }
            else
            {
                throw new InvalidOperationException("No eligible available team members to auto-assign this lead");
            }
        }
        else
        {
            assignTarget = await _context.Users
                .Include(u => u.Roles)
                .Include(u => u.Workspace)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (assignTarget == null)
            {
                throw new ArgumentException("Target user not found");
            }

            ValidateLeadAssigneeRole(assignTarget);
            algorithmDetails = "Assigned manually by Administrator.";
        }

        var oldOwner = lead.AssignedTo;
        lead.AssignedToId = assignTarget.Id;
        lead.AssignedById = user.Id;
        lead.AssignedDate = DateTime.UtcNow;
        lead.QueueStatus = assignTarget.Id == user.Id ? "IN_PIPELINE" : "ASSIGNED";
        if (assignTarget.WorkspaceId.HasValue)
        {
            lead.WorkspaceId = assignTarget.WorkspaceId.Value;
        }

        // Update any active follow-up reminders to the new assignee
        var activeFollowups = await _context.FollowupReminders
            .Where(f => f.LeadId == lead.Id && f.Status != "COMPLETED" && f.Status != "CANCELLED")
            .ToListAsync();
        foreach (var f in activeFollowups)
        {
            f.AssignedToId = assignTarget.Id;
        }

        await _context.SaveChangesAsync();

        assignTarget.LastAssignedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        try
        {
            var assignment = new LeadAssignment
            {
                LeadId = lead.Id,
                UserId = assignTarget.Id,
                AssignedAt = DateTime.UtcNow
            };
            _context.LeadAssignments.Add(assignment);

            var history = new LeadAssignmentHistory
            {
                LeadId = lead.Id,
                AssignedById = user.Id,
                AssignedToId = assignTarget.Id,
                Reason = algorithmDetails,
                AssignedAt = DateTime.UtcNow
            };
            _context.LeadAssignmentHistories.Add(history);

            var assignLog = new AssignmentLog
            {
                WorkspaceId = user.WorkspaceId!.Value,
                LeadId = lead.Id,
                UserId = assignTarget.Id,
                Strategy = algorithmDetails,
                AssignedAt = DateTime.UtcNow
            };
            _context.AssignmentLogs.Add(assignLog);

            var notif = new Notification
            {
                UserId = assignTarget.Id,
                Title = "New Lead Assigned",
                Message = $"You are now the sole active owner of lead: \"{lead.Name}\" (Lead #{lead.Id}).",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };
            _context.Notifications.Add(notif);

            if (oldOwner != null && oldOwner.Id != assignTarget.Id)
            {
                var oldNotif = new Notification
                {
                    UserId = oldOwner.Id,
                    Title = "Lead Reassigned",
                    Message = $"Lead \"{lead.Name}\" (Lead #{lead.Id}) has been reassigned to {assignTarget.FullName}.",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                };
                _context.Notifications.Add(oldNotif);
            }

            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[LeadService] Non-critical error during post-assignment logging: {ex.Message}");
        }

        return await ConvertToDtoAsync(lead);
    }

    public async Task<List<LeadDto>> BulkAssignLeadsAsync(List<long> leadIds, long userId, string userEmail)
    {
        var email = (userEmail ?? "").Trim().ToLower();
        var user = await _context.Users
            .Include(u => u.Roles)
            .Include(u => u.Workspace)
            .FirstOrDefaultAsync(u => u.Email.ToLower() == email);

        if (user == null)
        {
            user = await _context.Users
                .Include(u => u.Roles)
                .Include(u => u.Workspace)
                .FirstOrDefaultAsync();

            if (user == null)
            {
                throw new KeyNotFoundException("Admin user not found.");
            }
        }

        var pool = userId == -1 ? await GetEligibleAssigneesAsync(user.WorkspaceId) : new List<User>();
        if (userId == -1 && pool.Count == 0)
        {
            pool = await _context.Users.Include(u => u.Roles).ToListAsync();
            if (pool.Count == 0)
            {
                throw new InvalidOperationException("No eligible team members found in workspace to auto-assign leads.");
            }
        }

        Dictionary<long, int> workloadMap = new();
        if (userId == -1 && pool.Count > 0)
        {
            var activeAssigneeIds = await _context.Leads
                .Where(l => l.AssignedToId.HasValue && l.Status != "Converted" && l.Status != "Closed Won" && l.Status != "Lost" && l.Status != "Rejected")
                .Select(l => l.AssignedToId!.Value)
                .ToListAsync();

            var counts = activeAssigneeIds
                .GroupBy(id => id)
                .ToDictionary(g => g.Key, g => g.Count());

            foreach (var member in pool)
            {
                workloadMap[member.Id] = counts.TryGetValue(member.Id, out var c) ? c : 0;
            }
        }

        User? manualTarget = null;
        if (userId > 0)
        {
            manualTarget = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (manualTarget == null)
            {
                throw new ArgumentException("Target user not found");
            }
        }

        var updated = new List<LeadDto>();

        foreach (var id in leadIds)
        {
            var lead = await _context.Leads.FirstOrDefaultAsync(l => l.Id == id);
            if (lead == null) continue;

            User? assignTarget = null;
            if (userId == -1 && pool.Count > 0)
            {
                // Filter out users who have reached MaxCapacity (unless all are full)
                var availableCandidates = pool.Where(m =>
                    !m.MaxCapacity.HasValue || m.MaxCapacity.Value <= 0 || workloadMap[m.Id] < m.MaxCapacity.Value
                ).ToList();

                if (availableCandidates.Count == 0)
                {
                    availableCandidates = pool;
                }

                // Pick the executive with the least active workload, tie-broken by LastAssignedAt
                assignTarget = availableCandidates
                    .OrderBy(m => workloadMap[m.Id])
                    .ThenBy(m => m.LastAssignedAt ?? DateTime.MinValue)
                    .First();

                workloadMap[assignTarget.Id] = workloadMap[assignTarget.Id] + 1;
            }
            else
            {
                assignTarget = manualTarget;
            }

            if (assignTarget != null)
            {
                lead.AssignedToId = assignTarget.Id;
                lead.AssignedById = user.Id;
                lead.AssignedDate = DateTime.UtcNow;
                lead.QueueStatus = assignTarget.Id == user.Id ? "IN_PIPELINE" : "ASSIGNED";
                if (assignTarget.WorkspaceId.HasValue && assignTarget.WorkspaceId.Value > 0)
                {
                    lead.WorkspaceId = assignTarget.WorkspaceId.Value;
                }

                assignTarget.LastAssignedAt = DateTime.UtcNow;

                try
                {
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateException dbEx)
                {
                    Console.WriteLine($"[LeadService] Lead save error on lead {lead.Id}: {dbEx.InnerException?.Message ?? dbEx.Message}");
                }

                // Update active follow-up reminders
                try
                {
                    var activeFollowups = await _context.FollowupReminders
                        .Where(f => f.LeadId == lead.Id && f.Status != "COMPLETED" && f.Status != "CANCELLED")
                        .ToListAsync();
                    foreach (var f in activeFollowups)
                    {
                        f.AssignedToId = assignTarget.Id;
                    }
                    if (activeFollowups.Count > 0)
                    {
                        await _context.SaveChangesAsync();
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[LeadService] Followup update error: {ex.Message}");
                }

                try
                {
                    var assignment = new LeadAssignment
                    {
                        LeadId = lead.Id,
                        UserId = assignTarget.Id,
                        AssignedAt = DateTime.UtcNow
                    };
                    _context.LeadAssignments.Add(assignment);

                    var notif = new Notification
                    {
                        UserId = assignTarget.Id,
                        Title = "New Lead Assigned",
                        Message = $"You have been assigned to lead: \"{lead.Name}\" via bulk assignment.",
                        IsRead = false,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.Notifications.Add(notif);

                    if (lead.WorkspaceId > 0)
                    {
                        var assignLog = new AssignmentLog
                        {
                            WorkspaceId = lead.WorkspaceId,
                            LeadId = lead.Id,
                            UserId = assignTarget.Id,
                            Strategy = userId == -1 ? "Hybrid Auto-Assignment Engine" : "Manual Bulk Admin Assignment",
                            AssignedAt = DateTime.UtcNow
                        };
                        _context.AssignmentLogs.Add(assignLog);
                    }

                    await _context.SaveChangesAsync();
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[LeadService] Non-critical logging error during bulk assignment: {ex.Message}");
                }

                try
                {
                    updated.Add(await ConvertToDtoAsync(lead));
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[LeadService] DTO conversion error: {ex.Message}");
                }
            }
        }

        return updated;
    }

    public async Task<List<LeadDto>> BulkRandomAssignLeadsAsync(List<long> leadIds, string userEmail)
    {
        return await BulkAssignLeadsAsync(leadIds, -1, userEmail);
    }

    public async Task<List<LeadDto>> BulkUpdateLeadStatusAsync(List<long> leadIds, string status, string userEmail)
    {
        var email = userEmail.Trim().ToLower();
        var user = await _context.Users
            .Include(u => u.Workspace)
            .FirstOrDefaultAsync(u => u.Email == email);

        if (user == null)
        {
            throw new KeyNotFoundException("User not found");
        }

        var updated = new List<LeadDto>();
        foreach (var id in leadIds)
        {
            var lead = await _context.Leads
                .Include(l => l.Workspace)
                .Include(l => l.Campaign)
                .Include(l => l.AssignedTo)
                .Include(l => l.AssignedBy)
                .FirstOrDefaultAsync(l => l.Id == id);

            if (lead != null && lead.WorkspaceId == user.WorkspaceId)
            {
                lead.Status = status;
                if ("Converted".Equals(status, StringComparison.OrdinalIgnoreCase) && lead.Campaign != null)
                {
                    lead.Campaign.Conversions += 1;
                }
                await _context.SaveChangesAsync();
                updated.Add(await ConvertToDtoAsync(lead));
            }
        }

        return updated;
    }

    public async Task AddNoteAsync(long leadId, LeadNoteRequest request, string userEmail)
    {
        var email = userEmail.Trim().ToLower();
        var user = await _context.Users
            .Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.Email == email);

        if (user == null)
        {
            throw new KeyNotFoundException("User not found");
        }

        var lead = await _context.Leads.FirstOrDefaultAsync(l => l.Id == leadId);
        if (lead == null)
        {
            throw new ArgumentException("Lead not found");
        }

        bool isUserOnly = IsUserOnly(user);

        if (isUserOnly && (lead.AssignedToId == null || lead.AssignedToId != user.Id))
        {
            throw new InvalidOperationException("You cannot add notes to a lead not assigned to you");
        }

        var note = new LeadNote
        {
            LeadId = lead.Id,
            UserId = user.Id,
            Note = request.Note,
            CreatedAt = DateTime.UtcNow
        };

        _context.LeadNotes.Add(note);
        await _context.SaveChangesAsync();
    }

    public async Task<List<LeadNote>> GetNotesAsync(long leadId)
    {
        return await _context.LeadNotes
            .Include(n => n.User)
            .Where(n => n.LeadId == leadId)
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync();
    }

    public async Task<LeadDto> AddToPipelineAsync(long leadId, string userEmail)
    {
        var email = userEmail.Trim().ToLower();
        var user = await _context.Users
            .Include(u => u.Workspace)
            .FirstOrDefaultAsync(u => u.Email == email);

        if (user == null)
        {
            throw new KeyNotFoundException("User not found");
        }

        var lead = await _context.Leads
            .Include(l => l.Workspace)
            .Include(l => l.Campaign)
            .Include(l => l.AssignedTo)
            .Include(l => l.AssignedBy)
            .FirstOrDefaultAsync(l => l.Id == leadId);

        if (lead == null)
        {
            throw new ArgumentException($"Lead not found with id: {leadId}");
        }

        if (lead.AssignedToId == null)
        {
            lead.AssignedToId = user.Id;
            lead.AssignedTo = user;
        }

        lead.QueueStatus = "IN_PIPELINE";
        if (user.WorkspaceId.HasValue)
        {
            lead.WorkspaceId = user.WorkspaceId.Value;
        }

        await _context.SaveChangesAsync();
        return await ConvertToDtoAsync(lead);
    }

    public async Task<List<LeadDto>> GetPipelineLeadsAsync(string userEmail)
    {
        return await GetLeadsAsync(userEmail);
    }

    public async Task<List<LeadDto>> GetPendingAssignedLeadsAsync(string userEmail)
    {
        var email = userEmail.Trim().ToLower();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null)
        {
            throw new KeyNotFoundException("User not found");
        }

        var leads = await _context.Leads
            .Include(l => l.Workspace)
            .Include(l => l.Campaign)
            .Include(l => l.AssignedTo)
            .Include(l => l.AssignedBy)
            .Where(l => l.AssignedToId == user.Id && l.QueueStatus == "ASSIGNED")
            .OrderByDescending(l => l.CreatedAt)
            .ToListAsync();

        var dtos = new List<LeadDto>();
        foreach (var l in leads)
        {
            dtos.Add(await ConvertToDtoAsync(l));
        }

        return dtos;
    }

    public async Task<LeadDto> UpdateLeadActivityAsync(long leadId, string activityKey, string status, string? remarks, string userEmail)
    {
        var email = userEmail.Trim().ToLower();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null)
        {
            throw new KeyNotFoundException("User not found");
        }

        var lead = await _context.Leads
            .Include(l => l.Workspace)
            .Include(l => l.Campaign)
            .Include(l => l.AssignedTo)
            .Include(l => l.AssignedBy)
            .FirstOrDefaultAsync(l => l.Id == leadId);

        if (lead == null)
        {
            throw new ArgumentException($"Lead not found: {leadId}");
        }

        await EnsureDefaultSalesActivitiesAsync(lead);

        var normalizedKey = NormalizeActivityKey(activityKey);
        var activity = await _context.SalesActivities
            .FirstOrDefaultAsync(a => a.LeadId == leadId && a.ActivityName == normalizedKey);

        if (activity == null)
        {
            activity = new SalesActivity
            {
                LeadId = leadId,
                ActivityName = normalizedKey,
                Status = "PENDING"
            };
            _context.SalesActivities.Add(activity);
        }

        var oldStatus = activity.Status;
        activity.Status = status;
        if (remarks != null)
        {
            activity.Remarks = remarks;
        }

        await _context.SaveChangesAsync();
        await RecalculateLeadProgressAsync(lead);

        if ("FIRST_CALL".Equals(activityKey) && "COMPLETED".Equals(status) && ("New".Equals(lead.Status, StringComparison.OrdinalIgnoreCase) || "Contacted".Equals(lead.Status, StringComparison.OrdinalIgnoreCase)))
        {
            lead.Status = "Interaction";
        }
        else if ("PROPOSAL_SENT".Equals(activityKey) && "COMPLETED".Equals(status))
        {
            lead.Status = "Proposal Sent";
        }
        else if ("NEGOTIATION".Equals(activityKey) && "COMPLETED".Equals(status))
        {
            lead.Status = "Negotiation";
        }
        else if ("CLOSING".Equals(activityKey) && "COMPLETED".Equals(status))
        {
            lead.Status = "Converted";
        }
        else if (("LEAD_LOST".Equals(activityKey) || "LOST".Equals(activityKey)) && "COMPLETED".Equals(status))
        {
            lead.Status = "Lost";
        }

        await _context.SaveChangesAsync();

        var history = new LeadHistory
        {
            LeadId = lead.Id,
            Action = "ACTIVITY_UPDATE",
            Description = $"Activity {activity.ActivityName} updated from '{oldStatus}' to '{status}'. Remarks: {remarks ?? "None"}",
            PerformedById = user.Id,
            PreviousStatus = oldStatus,
            NewStatus = status,
            Timestamp = DateTime.UtcNow
        };
        _context.LeadHistories.Add(history);
        await _context.SaveChangesAsync();

        return await ConvertToDtoAsync(lead);
    }

    public async Task<LeadDto> AddStepActivityLogAsync(long leadId, string activityKey, AddActivityLogRequest request, string userEmail)
    {
        var email = userEmail.Trim().ToLower();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null)
        {
            throw new KeyNotFoundException("User not found");
        }

        var lead = await _context.Leads
            .Include(l => l.Workspace)
            .Include(l => l.Campaign)
            .Include(l => l.AssignedTo)
            .Include(l => l.AssignedBy)
            .FirstOrDefaultAsync(l => l.Id == leadId);

        if (lead == null)
        {
            throw new ArgumentException($"Lead not found: {leadId}");
        }

        await EnsureDefaultSalesActivitiesAsync(lead);

        var normalizedKey = NormalizeActivityKey(activityKey);
        var activity = await _context.SalesActivities
            .FirstOrDefaultAsync(a => a.LeadId == leadId && a.ActivityName == normalizedKey);

        if (activity == null)
        {
            activity = new SalesActivity
            {
                LeadId = leadId,
                ActivityName = normalizedKey,
                Title = StandardWorkflowStages.FirstOrDefault(s => s.Key == normalizedKey).Title ?? normalizedKey.Replace("_", " "),
                Status = "PENDING"
            };
            _context.SalesActivities.Add(activity);
            await _context.SaveChangesAsync();
        }

        if (string.Equals("PENDING", activity.Status, StringComparison.OrdinalIgnoreCase))
        {
            activity.Status = "IN_PROGRESS";
            await _context.SaveChangesAsync();
        }

        request = request ?? new AddActivityLogRequest();

        var count = await _context.SalesActivityLogs.CountAsync(l => l.LeadId == lead.Id && l.SalesActivityId == activity.Id);

        var activityLog = new SalesActivityLog
        {
            SalesActivityId = activity.Id,
            LeadId = lead.Id,
            ActivityNumber = count + 1,
            CommunicationType = request.CommunicationType ?? "PHONE_CALL",
            Outcome = request.Outcome ?? "BUSY",
            Remarks = request.Remarks,
            Duration = request.Duration ?? "5 mins",
            Status = request.Status ?? "ATTEMPTED",
            NextFollowupDate = request.NextFollowupDate,
            Attachments = request.Attachments,
            LoggedById = user.Id,
            CreatedAt = DateTime.UtcNow
        };
        _context.SalesActivityLogs.Add(activityLog);
        await _context.SaveChangesAsync();

        if (request.ProposalAmount.HasValue && request.ProposalAmount.Value > 0)
        {
            lead.ProposalAmount = request.ProposalAmount.Value;
            if (!string.IsNullOrEmpty(request.ProposalStatus))
            {
                lead.ProposalStatus = request.ProposalStatus;
            }
        }

        if ("New".Equals(lead.Status, StringComparison.OrdinalIgnoreCase) || "Contacted".Equals(lead.Status, StringComparison.OrdinalIgnoreCase))
        {
            lead.Status = "Interaction";
        }
        await _context.SaveChangesAsync();

        if (request.NextFollowupDate.HasValue)
        {
            try
            {
                var followup = new FollowupReminder
                {
                    WorkspaceId = lead.WorkspaceId,
                    LeadId = lead.Id,
                    AssignedToId = lead.AssignedToId ?? user.Id,
                    ScheduledAt = request.NextFollowupDate.Value,
                    Type = "CALL",
                    Notes = $"Follow-up created from Workflow Step '{activity.ActivityName}': {request.Remarks ?? "Follow-up required"}",
                    Status = "UPCOMING",
                    CreatedAt = DateTime.UtcNow
                };
                _context.FollowupReminders.Add(followup);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[LeadService] Non-critical error creating followup reminder: {ex.Message}");
            }
        }

        try
        {
            await ResolveOverdueFollowupsForLeadAsync(lead, request.Outcome);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[LeadService] Non-critical error resolving followups: {ex.Message}");
        }

        try
        {
            var history = new LeadHistory
            {
                LeadId = lead.Id,
                Action = "ACTIVITY_LOG_ADDED",
                Description = $"Logged activity {request.Outcome ?? "ATTEMPTED"} for {activity.ActivityName}: {request.Remarks ?? "No remarks"}",
                PerformedById = user.Id,
                PreviousStatus = activity.Status,
                NewStatus = activity.Status,
                Timestamp = DateTime.UtcNow
            };
            _context.LeadHistories.Add(history);
            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[LeadService] Non-critical error saving history: {ex.Message}");
        }

        return await ConvertToDtoAsync(lead);
    }

    public async Task<LeadDto> CompleteWorkflowStepAsync(long leadId, string activityKey, CompleteStepRequest? request, string userEmail)
    {
        var email = userEmail.Trim().ToLower();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null)
        {
            throw new KeyNotFoundException("User not found");
        }

        var lead = await _context.Leads
            .Include(l => l.Workspace)
            .Include(l => l.Campaign)
            .Include(l => l.AssignedTo)
            .Include(l => l.AssignedBy)
            .FirstOrDefaultAsync(l => l.Id == leadId);

        if (lead == null)
        {
            throw new ArgumentException($"Lead not found: {leadId}");
        }

        await EnsureDefaultSalesActivitiesAsync(lead);

        var normalizedKey = NormalizeActivityKey(activityKey);
        var activity = await _context.SalesActivities
            .FirstOrDefaultAsync(a => a.LeadId == leadId && a.ActivityName == normalizedKey);

        if (activity == null)
        {
            activity = new SalesActivity
            {
                LeadId = leadId,
                ActivityName = normalizedKey,
                Title = StandardWorkflowStages.FirstOrDefault(s => s.Key == normalizedKey).Title ?? normalizedKey.Replace("_", " "),
                Status = "PENDING"
            };
            _context.SalesActivities.Add(activity);
        }

        var oldStatus = activity.Status;
        activity.Status = "COMPLETED";
        activity.CompletedAt = DateTime.UtcNow;
        activity.CompletedById = user.Id;
        if (request?.CompletionRemarks != null)
        {
            activity.CompletionRemarks = request.CompletionRemarks;
        }

        await _context.SaveChangesAsync();
        await RecalculateLeadProgressAsync(lead);

        if (request?.ProposalAmount.HasValue == true && request.ProposalAmount.Value > 0)
        {
            lead.ProposalAmount = request.ProposalAmount.Value;
            if (!string.IsNullOrEmpty(request.ProposalStatus))
            {
                lead.ProposalStatus = request.ProposalStatus;
            }
            else if ("PROPOSAL_SENT".Equals(activityKey))
            {
                lead.ProposalStatus = "SENT";
            }
            else if ("NEGOTIATION".Equals(activityKey))
            {
                lead.ProposalStatus = "NEGOTIATING";
            }
        }

        if ("FIRST_CALL".Equals(activityKey) && ("New".Equals(lead.Status, StringComparison.OrdinalIgnoreCase) || "Contacted".Equals(lead.Status, StringComparison.OrdinalIgnoreCase)))
        {
            lead.Status = "Interaction";
        }
        else if ("REQUIREMENT_COLLECTION".Equals(activityKey))
        {
            lead.Status = "Interested";
        }
        else if ("DEMO_SCHEDULED".Equals(activityKey))
        {
            lead.Status = "Qualified";
        }
        else if ("PROPOSAL_SENT".Equals(activityKey))
        {
            lead.Status = "Proposal Sent";
            if (string.IsNullOrEmpty(lead.ProposalStatus)) lead.ProposalStatus = "SENT";
        }
        else if ("NEGOTIATION".Equals(activityKey))
        {
            lead.Status = "Negotiation";
            if (string.IsNullOrEmpty(lead.ProposalStatus)) lead.ProposalStatus = "NEGOTIATING";
        }
        else if ("CLOSING".Equals(activityKey))
        {
            lead.Status = "Converted";
            lead.ProposalStatus = "ACCEPTED";
        }
        else if ("PAYMENT_FOLLOWUP".Equals(activityKey))
        {
            lead.Status = "Payment Completed";
        }
        else if ("LEAD_LOST".Equals(activityKey, StringComparison.OrdinalIgnoreCase) || "LOST".Equals(activityKey, StringComparison.OrdinalIgnoreCase))
        {
            lead.Status = "Lost";
            lead.ProposalStatus = "REJECTED";
        }

        await _context.SaveChangesAsync();

        var history = new LeadHistory
        {
            LeadId = lead.Id,
            Action = "STEP_COMPLETED",
            Description = $"Completed workflow step {activity.ActivityName}. Remarks: {request?.CompletionRemarks ?? "Completed"}",
            PerformedById = user.Id,
            PreviousStatus = oldStatus,
            NewStatus = "COMPLETED",
            Timestamp = DateTime.UtcNow
        };
        _context.LeadHistories.Add(history);
        await _context.SaveChangesAsync();

        await ResolveOverdueFollowupsForLeadAsync(lead, request?.CompletionRemarks);

        return await ConvertToDtoAsync(lead);
    }

    public async Task<List<SalesActivityLogDto>> GetLeadActivityLogsAsync(long leadId)
    {
        var logs = await _context.SalesActivityLogs
            .Include(l => l.LoggedBy)
            .Include(l => l.SalesActivity)
            .Where(l => l.LeadId == leadId)
            .OrderByDescending(l => l.CreatedAt)
            .ToListAsync();

        return logs.Select(l => new SalesActivityLogDto
        {
            Id = l.Id,
            SalesActivityId = l.SalesActivityId,
            LeadId = l.LeadId,
            ActivityNumber = l.ActivityNumber,
            ActivityKey = l.SalesActivity?.ActivityName ?? "FIRST_CALL",
            Action = l.Outcome,
            CommunicationType = l.CommunicationType,
            Outcome = l.Outcome,
            Remarks = l.Remarks,
            Duration = l.Duration,
            Status = l.Status,
            NextFollowupDate = l.NextFollowupDate,
            Attachments = l.Attachments,
            LoggedById = l.LoggedById,
            LoggedByName = l.LoggedBy != null ? l.LoggedBy.FullName : "Sales Rep",
            CreatedAt = l.CreatedAt
        }).ToList();
    }

    public async Task<Dictionary<string, int>> GetWorkflowPendingCountsAsync(string userEmail)
    {
        var email = userEmail.Trim().ToLower();
        var user = await _context.Users
            .Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.Email == email);

        if (user == null)
        {
            throw new KeyNotFoundException("User not found");
        }

        List<Lead> leads;
        if (user.Roles.Any(r => r.Name == "ROLE_ADMIN" || r.Name == "ROLE_MANAGER"))
        {
            leads = await _context.Leads.Where(l => l.WorkspaceId == user.WorkspaceId).ToListAsync();
        }
        else
        {
            leads = await _context.Leads.Where(l => l.AssignedToId == user.Id).ToListAsync();
        }

        var counts = new Dictionary<string, int>
        {
            { "pendingFirstCalls", 0 },
            { "pendingRequirementCollection", 0 },
            { "pendingDemo", 0 },
            { "pendingProposal", 0 },
            { "pendingNegotiation", 0 },
            { "pendingPayment", 0 }
        };

        var leadIds = leads.Select(l => l.Id).ToList();
        var activities = await _context.SalesActivities
            .Where(a => leadIds.Contains(a.LeadId))
            .ToListAsync();

        foreach (var act in activities)
        {
            if (!string.Equals("COMPLETED", act.Status, StringComparison.OrdinalIgnoreCase))
            {
                switch (act.ActivityName)
                {
                    case "FIRST_CALL":
                        counts["pendingFirstCalls"]++;
                        break;
                    case "REQUIREMENT_COLLECTION":
                        counts["pendingRequirementCollection"]++;
                        break;
                    case "DEMO_SCHEDULED":
                        counts["pendingDemo"]++;
                        break;
                    case "PROPOSAL_SENT":
                        counts["pendingProposal"]++;
                        break;
                    case "NEGOTIATION":
                        counts["pendingNegotiation"]++;
                        break;
                    case "PAYMENT_FOLLOWUP":
                        counts["pendingPayment"]++;
                        break;
                }
            }
        }

        return counts;
    }

    public async Task<LeadDto> UpdateLeadWorkspaceAsync(long leadId, LeadDto updateDto, string userEmail)
    {
        var email = userEmail.Trim().ToLower();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null)
        {
            throw new KeyNotFoundException("User not found");
        }

        var lead = await _context.Leads
            .Include(l => l.Workspace)
            .Include(l => l.Campaign)
            .Include(l => l.AssignedTo)
            .Include(l => l.AssignedBy)
            .FirstOrDefaultAsync(l => l.Id == leadId);

        if (lead == null)
        {
            throw new ArgumentException($"Lead not found: {leadId}");
        }

        var oldStatus = lead.Status;
        if (!string.IsNullOrWhiteSpace(updateDto.Status)) lead.Status = updateDto.Status;
        if (updateDto.Company != null) lead.Company = updateDto.Company;
        if (updateDto.Location != null) lead.Location = updateDto.Location;
        if (updateDto.Priority != null) lead.Priority = updateDto.Priority;
        if (updateDto.ClientNotes != null) lead.ClientNotes = updateDto.ClientNotes;
        if (updateDto.ProposalAmount.HasValue) lead.ProposalAmount = updateDto.ProposalAmount;
        if (updateDto.ProposalStatus != null) lead.ProposalStatus = updateDto.ProposalStatus;
        if (updateDto.ProgressPercentage.HasValue) lead.ProgressPercentage = updateDto.ProgressPercentage;

        await _context.SaveChangesAsync();

        var desc = "Workspace auto-saved/updated.";
        if (updateDto.Status != null && !updateDto.Status.Equals(oldStatus))
        {
            desc = $"Lead status transitioned from {oldStatus} to {updateDto.Status}";
        }

        var history = new LeadHistory
        {
            LeadId = lead.Id,
            Action = "WORKSPACE_UPDATE",
            Description = desc,
            PerformedById = user.Id,
            PreviousStatus = oldStatus,
            NewStatus = lead.Status,
            Timestamp = DateTime.UtcNow
        };
        _context.LeadHistories.Add(history);
        await _context.SaveChangesAsync();

        return await ConvertToDtoAsync(lead);
    }

    public async Task<List<LeadHistoryDto>> GetLeadTimelineAsync(long leadId)
    {
        var list = await _context.LeadHistories
            .Include(h => h.PerformedBy)
            .Where(h => h.LeadId == leadId)
            .OrderByDescending(h => h.Timestamp)
            .ToListAsync();

        return list.Select(h => new LeadHistoryDto
        {
            Id = h.Id,
            LeadId = h.LeadId,
            Action = h.Action,
            Description = h.Description ?? $"Action {h.Action}",
            PerformedById = h.PerformedById,
            PerformedByName = h.PerformedBy != null ? h.PerformedBy.FullName : "System",
            PreviousStatus = h.PreviousStatus,
            NewStatus = h.NewStatus,
            Timestamp = h.Timestamp ?? DateTime.UtcNow
        }).ToList();
    }

    public async Task<List<ContactRepoDto>> GetContactsRepositoryAsync(string userEmail)
    {
        var leads = await GetLeadsAsync(userEmail);
        var contactList = new List<ContactRepoDto>();

        foreach (var lead in leads)
        {
            var logs = await _context.SalesActivityLogs
                .Where(l => l.LeadId == lead.Id)
                .OrderByDescending(l => l.CreatedAt)
                .ToListAsync();

            long calls = 0, emails = 0, whatsapp = 0;
            DateTime? firstContactDate = lead.CreatedAt;
            DateTime? lastContactDate = lead.CreatedAt;

            foreach (var l in logs)
            {
                if (firstContactDate == null || l.CreatedAt < firstContactDate) firstContactDate = l.CreatedAt;
                if (lastContactDate == null || l.CreatedAt > lastContactDate) lastContactDate = l.CreatedAt;

                var commType = (l.CommunicationType ?? "").ToUpper();
                if (commType.Contains("CALL") || commType.Contains("PHONE")) calls++;
                else if (commType.Contains("EMAIL")) emails++;
                else if (commType.Contains("WHATSAPP")) whatsapp++;
            }

            var dto = new ContactRepoDto
            {
                LeadId = lead.Id,
                Name = lead.Name,
                Company = lead.Company ?? "N/A",
                Email = lead.Email,
                Phone = lead.Phone,
                SourcePlatform = lead.SourcePlatform,
                CurrentStage = lead.Status ?? "New",
                AssignedToId = lead.AssignedToId,
                AssignedToName = lead.AssignedToName,
                QualityScore = lead.QualityScore ?? 75,
                QualityTier = lead.QualityTier ?? "WARM",
                ConversionProbability = lead.ConversionProbability ?? 75.0,
                FirstContactDate = firstContactDate,
                LastContactDate = lastContactDate,
                TotalCalls = calls,
                TotalEmails = emails,
                TotalWhatsApp = whatsapp,
                TotalInteractionsCount = logs.Count,
                LastActivityDescription = logs.Count > 0 ? (logs[0].Outcome ?? logs[0].CommunicationType) : "Pipeline Lead",
                CreatedAt = lead.CreatedAt
            };

            contactList.Add(dto);
        }

        return contactList;
    }

    public async Task<List<LeadDto>> GetHighPriorityLeadsAsync(string userEmail)
    {
        var all = await GetLeadsAsync(userEmail);
        var priorityKeys = new[] { "HIGH", "URGENT", "HOT", "P1_OVERDUE_FOLLOWUP", "P2_TODAY_NEGOTIATION" };
        return all.Where(l => l.Priority != null && priorityKeys.Contains(l.Priority.ToUpper())).ToList();
    }

    public async Task<List<LeadDto>> GetNewLeadsTodayAsync(string userEmail)
    {
        var all = await GetLeadsAsync(userEmail);
        var today = DateTime.UtcNow.Date;
        return all.Where(l => string.Equals("New", l.Status, StringComparison.OrdinalIgnoreCase) || l.CreatedAt >= today).ToList();
    }

    public async Task<List<LeadDto>> GetNegotiationLeadsAsync(string userEmail)
    {
        var all = await GetLeadsAsync(userEmail);
        return all.Where(l => string.Equals("Negotiation", l.Status, StringComparison.OrdinalIgnoreCase)).ToList();
    }

    private async Task ResolveOverdueFollowupsForLeadAsync(Lead lead, string? outcome)
    {
        var existing = await _context.FollowupReminders
            .Where(f => f.LeadId == lead.Id)
            .ToListAsync();

        var pendingStatuses = new[] { "UPCOMING", "PENDING", "OVERDUE", "MISSED" };
        foreach (var r in existing)
        {
            if (pendingStatuses.Contains(r.Status.ToUpper()))
            {
                r.Status = "COMPLETED";
                if (!string.IsNullOrWhiteSpace(outcome))
                {
                    r.Outcome = outcome;
                }
            }
        }
        await _context.SaveChangesAsync();
    }

    private async Task EnsureDefaultSalesActivitiesAsync(Lead lead)
    {
        var existing = await _context.SalesActivities.Where(a => a.LeadId == lead.Id).ToListAsync();
        if (existing.Count == 0)
        {
            var defaults = new List<SalesActivity>
            {
                new SalesActivity { LeadId = lead.Id, ActivityName = "FIRST_CALL", Title = "First Call", Status = "PENDING" },
                new SalesActivity { LeadId = lead.Id, ActivityName = "REQUIREMENT_COLLECTION", Title = "Requirement Collection", Status = "PENDING" },
                new SalesActivity { LeadId = lead.Id, ActivityName = "DEMO_SCHEDULED", Title = "Demo Scheduled", Status = "PENDING" },
                new SalesActivity { LeadId = lead.Id, ActivityName = "PROPOSAL_SENT", Title = "Proposal Sent", Status = "PENDING" },
                new SalesActivity { LeadId = lead.Id, ActivityName = "NEGOTIATION", Title = "Negotiation", Status = "PENDING" },
                new SalesActivity { LeadId = lead.Id, ActivityName = "CLOSING", Title = "Closing", Status = "PENDING" },
                new SalesActivity { LeadId = lead.Id, ActivityName = "PAYMENT_FOLLOWUP", Title = "Payment Follow-up", Status = "PENDING" },
                new SalesActivity { LeadId = lead.Id, ActivityName = "LEAD_LOST", Title = "Lead Lost / Dropped", Status = "PENDING" }
            };
            _context.SalesActivities.AddRange(defaults);
            await _context.SaveChangesAsync();
        }
    }

    private async Task RecalculateLeadProgressAsync(Lead lead)
    {
        var activities = await _context.SalesActivities.Where(a => a.LeadId == lead.Id).ToListAsync();
        var activeActivities = activities.Where(a => !string.Equals("LEAD_LOST", a.ActivityName, StringComparison.OrdinalIgnoreCase)).ToList();

        var completedActiveCount = activeActivities.Count(a => string.Equals("COMPLETED", a.Status, StringComparison.OrdinalIgnoreCase));
        int progress = 20;

        if (activeActivities.Count > 0)
        {
            progress = (int)Math.Round(((double)completedActiveCount / activeActivities.Count) * 100);
        }

        var st = lead.Status ?? "";
        if ("Converted".Equals(st, StringComparison.OrdinalIgnoreCase) || "Closed Won".Equals(st, StringComparison.OrdinalIgnoreCase) || "Negotiation".Equals(st, StringComparison.OrdinalIgnoreCase))
        {
            progress = Math.Max(progress, 100);
        }
        else if ("Proposal Sent".Equals(st, StringComparison.OrdinalIgnoreCase) || "Proposal".Equals(st, StringComparison.OrdinalIgnoreCase))
        {
            progress = Math.Max(progress, 80);
        }
        else if ("Qualified".Equals(st, StringComparison.OrdinalIgnoreCase) || "Demo Scheduled".Equals(st, StringComparison.OrdinalIgnoreCase) || "Interested".Equals(st, StringComparison.OrdinalIgnoreCase))
        {
            progress = Math.Max(progress, 60);
        }
        else if ("Contacted".Equals(st, StringComparison.OrdinalIgnoreCase) || "Interaction".Equals(st, StringComparison.OrdinalIgnoreCase) || "Follow-up".Equals(st, StringComparison.OrdinalIgnoreCase))
        {
            progress = Math.Max(progress, 40);
        }
        else if ("New".Equals(st, StringComparison.OrdinalIgnoreCase))
        {
            progress = Math.Max(progress, 20);
        }

        lead.ProgressPercentage = Math.Min(100, Math.Max(20, progress));
        await _context.SaveChangesAsync();
    }

    private async Task<List<User>> GetEligibleAssigneesAsync(long? workspaceId)
    {
        List<User> allMembers = new();

        if (workspaceId.HasValue && workspaceId.Value > 0)
        {
            allMembers = await _context.Users
                .Include(u => u.Roles)
                .Where(u => u.WorkspaceId == workspaceId.Value && (u.Status == null || !string.Equals("SUSPENDED", u.Status)))
                .ToListAsync();
        }

        if (allMembers.Count == 0)
        {
            // Global fallback to all active non-suspended users across the system
            allMembers = await _context.Users
                .Include(u => u.Roles)
                .Where(u => u.Status == null || !string.Equals("SUSPENDED", u.Status))
                .ToListAsync();
        }

        if (allMembers.Count == 0) return new List<User>();

        // 1. Prefer non-admin users (e.g. Sales reps / members like Shubham Singh, Gagan Singh)
        var candidates = allMembers.Where(u => 
            u.Roles == null || u.Roles.Count == 0 || !u.Roles.Any(r => r.Name.Contains("ADMIN", StringComparison.OrdinalIgnoreCase))
        ).ToList();

        // 2. If no non-admins found, use all members
        if (candidates.Count == 0)
        {
            candidates = allMembers;
        }

        return candidates.OrderBy(u => u.LastAssignedAt ?? DateTime.MinValue).ToList();
    }

    private async Task<User?> FindBestLeadAssigneeAsync(long? workspaceId)
    {
        var pool = await GetEligibleAssigneesAsync(workspaceId);
        if (pool.Count == 0) return null;

        var activeAssigneeIds = await _context.Leads
            .Where(l => l.AssignedToId.HasValue && l.Status != "Converted" && l.Status != "Closed Won" && l.Status != "Lost" && l.Status != "Rejected")
            .Select(l => l.AssignedToId!.Value)
            .ToListAsync();

        var counts = activeAssigneeIds
            .GroupBy(id => id)
            .ToDictionary(g => g.Key, g => g.Count());

        var availableCandidates = pool.Where(m =>
            !m.MaxCapacity.HasValue || m.MaxCapacity.Value <= 0 || (counts.TryGetValue(m.Id, out var c) ? c : 0) < m.MaxCapacity.Value
        ).ToList();

        if (availableCandidates.Count == 0)
        {
            availableCandidates = pool;
        }

        return availableCandidates
            .OrderBy(m => counts.TryGetValue(m.Id, out var c) ? c : 0)
            .ThenBy(m => m.LastAssignedAt ?? DateTime.MinValue)
            .FirstOrDefault();
    }

    private static void ValidateLeadAssigneeRole(User? targetUser)
    {
        // Allow assigning leads to any valid active workspace member
        if (targetUser == null) return;
    }

    private static int CalculateProgressPercentage(string? status)
    {
        if (string.IsNullOrWhiteSpace(status)) return 10;
        return status.Trim().ToLower() switch
        {
            "new" or "new lead" => 10,
            "interaction" or "contacted" => 25,
            "qualified" => 50,
            "meeting scheduled" or "demo scheduled" => 65,
            "proposal sent" or "proposal" => 80,
            "negotiation" or "negotiation started" => 90,
            "converted" or "closed won" or "won" => 100,
            "rejected" or "closed lost" or "lost" => 0,
            _ => 25
        };
    }

    private static string NormalizeActivityKey(string? key)
    {
        if (string.IsNullOrEmpty(key)) return "FIRST_CALL";
        var normalized = key.ToUpper().Trim().Replace(" ", "_");
        if (normalized is "INTERACTION" or "CONTACTED" or "FIRSTCALL" or "FIRST_CALL") return "FIRST_CALL";
        if (normalized is "REQUIREMENT" or "REQUIREMENTS" or "REQUIREMENT_COLLECTION" or "FOLLOW_UP" or "FOLLOWUP") return "REQUIREMENT_COLLECTION";
        if (normalized is "DEMO" or "DEMOSCHEDULED" or "DEMO_SCHEDULED") return "DEMO_SCHEDULED";
        if (normalized is "PROPOSAL" or "PROPOSALSENT" or "PROPOSAL_SENT") return "PROPOSAL_SENT";
        if (normalized is "NEGOTIATION") return "NEGOTIATION";
        if (normalized is "CLOSING" or "CONVERTED") return "CLOSING";
        if (normalized is "PAYMENT" or "PAYMENT_COMPLETED" or "PAYMENT_FOLLOWUP") return "PAYMENT_FOLLOWUP";
        if (normalized is "LEAD_LOST" or "LOST" or "DROP" or "DROPPED") return "LEAD_LOST";
        return normalized;
    }

    private static readonly (string Key, string Title)[] StandardWorkflowStages = new[]
    {
        ("FIRST_CALL", "First Call"),
        ("REQUIREMENT_COLLECTION", "Requirement Collection"),
        ("DEMO_SCHEDULED", "Demo Scheduled"),
        ("PROPOSAL_SENT", "Proposal Sent"),
        ("NEGOTIATION", "Negotiation"),
        ("CLOSING", "Closing"),
        ("PAYMENT_FOLLOWUP", "Payment Follow-up"),
        ("LEAD_LOST", "Lead Lost / Dropped")
    };

    private async Task<LeadDto> ConvertToDtoAsync(Lead lead)
    {
        var activityDtos = new List<SalesActivityDto>();
        try
        {
            var activities = await _context.SalesActivities
                .Where(a => a.LeadId == lead.Id)
                .OrderBy(a => a.Id)
                .ToListAsync();

            var logs = await _context.SalesActivityLogs
                .Include(l => l.LoggedBy)
                .Where(l => l.LeadId == lead.Id)
                .OrderBy(l => l.CreatedAt)
                .ToListAsync();

            var activityMap = activities.ToDictionary(a => NormalizeActivityKey(a.ActivityName), a => a, StringComparer.OrdinalIgnoreCase);

            foreach (var (key, title) in StandardWorkflowStages)
            {
                activityMap.TryGetValue(key, out var act);
                var stageLogs = logs.Where(l => (act != null && l.SalesActivityId == act.Id) || string.Equals(NormalizeActivityKey(l.CommunicationType), key, StringComparison.OrdinalIgnoreCase)).ToList();

                var logDtos = stageLogs.Select((l, idx) => new SalesActivityLogDto
                {
                    Id = l.Id,
                    SalesActivityId = act?.Id ?? l.SalesActivityId ?? 0,
                    LeadId = lead.Id,
                    ActivityNumber = l.ActivityNumber > 0 ? l.ActivityNumber : idx + 1,
                    ActivityKey = key,
                    Action = l.Outcome,
                    CommunicationType = l.CommunicationType,
                    Outcome = l.Outcome,
                    Remarks = l.Remarks,
                    Duration = l.Duration,
                    Status = l.Status,
                    NextFollowupDate = l.NextFollowupDate,
                    Attachments = l.Attachments,
                    LoggedById = l.LoggedById,
                    LoggedByName = l.LoggedBy != null ? l.LoggedBy.FullName : "Sales Rep",
                    CreatedAt = l.CreatedAt
                }).ToList();

                activityDtos.Add(new SalesActivityDto
                {
                    Id = act?.Id ?? 0,
                    LeadId = lead.Id,
                    ActivityKey = key,
                    Title = title,
                    Status = act?.Status ?? "PENDING",
                    CompletedAt = act?.CompletedAt,
                    CompletedById = act?.CompletedById,
                    CompletedByName = act?.CompletedBy?.FullName,
                    CompletionRemarks = act?.CompletionRemarks,
                    Remarks = act?.Remarks,
                    CreatedAt = act?.CreatedAt ?? lead.CreatedAt,
                    ActivityLogs = logDtos,
                    Logs = logDtos
                });
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[LeadService] Non-critical error loading sales activities: {ex.Message}");
            if (activityDtos.Count == 0)
            {
                foreach (var (key, title) in StandardWorkflowStages)
                {
                    activityDtos.Add(new SalesActivityDto
                    {
                        Id = 0,
                        LeadId = lead.Id,
                        ActivityKey = key,
                        Title = title,
                        Status = "PENDING",
                        CreatedAt = lead.CreatedAt,
                        ActivityLogs = new List<SalesActivityLogDto>(),
                        Logs = new List<SalesActivityLogDto>()
                    });
                }
            }
        }

        FollowupReminder? followup = null;
        try
        {
            followup = await _context.FollowupReminders
                .Where(f => f.LeadId == lead.Id)
                .OrderByDescending(f => f.ScheduledAt)
                .FirstOrDefaultAsync();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[LeadService] Non-critical error loading followup reminders: {ex.Message}");
        }

        return new LeadDto
        {
            Id = lead.Id,
            WorkspaceId = lead.WorkspaceId,
            CampaignId = lead.CampaignId,
            Name = lead.Name,
            Email = lead.Email,
            Phone = lead.Phone,
            SourcePlatform = lead.SourcePlatform,
            CampaignName = lead.CampaignName,
            Status = lead.Status,
            AssignedToId = lead.AssignedToId,
            AssignedToName = lead.AssignedTo != null ? lead.AssignedTo.FullName : "Unassigned",
            AssignedById = lead.AssignedById,
            AssignedByName = lead.AssignedBy != null ? lead.AssignedBy.FullName : "System Queue",
            AssignedDate = lead.AssignedDate ?? lead.CreatedAt,
            QualityScore = lead.QualityScore ?? 75,
            QualityTier = lead.QualityTier ?? "WARM",
            ConversionProbability = lead.ConversionProbability ?? 75.0,
            QueueStatus = lead.QueueStatus ?? (lead.AssignedToId.HasValue ? "ASSIGNED" : "IN_QUEUE"),
            Company = lead.Company ?? "N/A",
            Location = lead.Location ?? "Remote / Unspecified",
            Priority = lead.Priority ?? "MEDIUM",
            ProgressPercentage = lead.ProgressPercentage ?? 0,
            LastFollowupDate = lead.LastFollowupDate,
            DueDate = lead.DueDate,
            ClientNotes = lead.ClientNotes,
            ProposalAmount = lead.ProposalAmount,
            ProposalStatus = lead.ProposalStatus,
            CreatedAt = lead.CreatedAt,
            NextFollowupDate = followup?.ScheduledAt,
            FollowupNotes = followup?.Notes,
            FollowupType = followup?.Type ?? "CALL",
            FollowupStatus = followup?.Status ?? "UPCOMING",
            Activities = activityDtos
        };
    }

    private static bool IsUserOnly(User user)
    {
        if (user == null || user.Roles == null || user.Roles.Count == 0) return true;
        return user.Roles.All(r => !r.Name.Contains("ADMIN", StringComparison.OrdinalIgnoreCase) && !r.Name.Contains("MANAGER", StringComparison.OrdinalIgnoreCase));
    }
}
