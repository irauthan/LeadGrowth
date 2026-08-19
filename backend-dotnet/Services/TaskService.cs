using LeadGrowth.Data;
using LeadGrowth.DTOs;
using LeadGrowth.Models;
using Microsoft.EntityFrameworkCore;

namespace LeadGrowth.Services;

public class TaskService : ITaskService
{
    private readonly LeadGrowthDbContext _context;

    public TaskService(LeadGrowthDbContext context)
    {
        _context = context;
    }

    public async Task<List<TaskDto>> GetTasksAsync(string userEmail)
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

        bool isUserOnly = IsUserOnly(user);

        List<TaskModel> tasks;
        if (isUserOnly)
        {
            tasks = await _context.Tasks
                .Include(t => t.AssignedTo)
                .Include(t => t.AssignedBy)
                .Where(t => t.AssignedToId == user.Id)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();
        }
        else
        {
            tasks = await _context.Tasks
                .Include(t => t.AssignedTo)
                .Include(t => t.AssignedBy)
                .Where(t => t.WorkspaceId == user.WorkspaceId)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();
        }

        return tasks.Select(ConvertToDto).ToList();
    }

    public async Task<List<TaskDto>> GetTodayTasksAsync(string userEmail)
    {
        var all = await GetTasksAsync(userEmail);
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        return all.Where(t => t.DueDate.HasValue && t.DueDate.Value == today).ToList();
    }

    public async Task<List<TaskDto>> GetCompletedTasksAsync(string userEmail)
    {
        var all = await GetTasksAsync(userEmail);
        var completedStatuses = new[] { "COMPLETED", "APPROVED", "Completed" };
        return all.Where(t => t.Status != null && completedStatuses.Contains(t.Status)).ToList();
    }

    public async Task<List<TaskDto>> GetOverdueTasksAsync(string userEmail)
    {
        var all = await GetTasksAsync(userEmail);
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var completedStatuses = new[] { "COMPLETED", "APPROVED", "Completed" };
        return all.Where(t => t.DueDate.HasValue && t.DueDate.Value < today && (t.Status == null || !completedStatuses.Contains(t.Status))).ToList();
    }

    public async Task<TaskDto> CreateTaskAsync(TaskDto dto, string userEmail)
    {
        var email = userEmail.Trim().ToLower();
        var creator = await _context.Users
            .Include(u => u.Workspace)
            .FirstOrDefaultAsync(u => u.Email == email);

        if (creator == null)
        {
            throw new KeyNotFoundException("User not found");
        }

        User? assignedTo = null;
        if (dto.AssignedToId.HasValue && dto.AssignedToId.Value > 0)
        {
            assignedTo = await _context.Users.FirstOrDefaultAsync(u => u.Id == dto.AssignedToId.Value);
        }
        else if (dto.AssignedToId.HasValue && dto.AssignedToId.Value == -1)
        {
            assignedTo = await FindBestTaskAssigneeAsync(creator.Workspace!);
        }

        var task = new TaskModel
        {
            WorkspaceId = creator.WorkspaceId!.Value,
            Workspace = creator.Workspace!,
            Title = dto.Title,
            Description = dto.Description,
            AssignedToId = assignedTo?.Id,
            AssignedTo = assignedTo,
            AssignedById = creator.Id,
            AssignedBy = creator,
            DueDate = dto.DueDate,
            DueTime = dto.DueTime,
            ReminderMinutes = dto.ReminderMinutes,
            Priority = dto.Priority ?? "Medium",
            Status = dto.Status ?? "Pending",
            AssignedAt = assignedTo != null ? DateTime.UtcNow : null,
            CreatedAt = DateTime.UtcNow
        };

        _context.Tasks.Add(task);
        await _context.SaveChangesAsync();

        if (assignedTo != null)
        {
            var assignment = new TaskAssignment
            {
                TaskId = task.Id,
                UserId = assignedTo.Id,
                AssignedAt = DateTime.UtcNow
            };
            _context.TaskAssignments.Add(assignment);

            var notif = new Notification
            {
                UserId = assignedTo.Id,
                Title = "New Task Assigned",
                Message = $"You have been assigned to task: \"{task.Title}\".",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };
            _context.Notifications.Add(notif);
            await _context.SaveChangesAsync();
        }

        return ConvertToDto(task);
    }

    public async Task<TaskDto> ConvertLeadToTaskAsync(long leadId, string? customTitle, string userEmail)
    {
        var email = userEmail.Trim().ToLower();
        var user = await _context.Users
            .Include(u => u.Workspace)
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

        var title = !string.IsNullOrWhiteSpace(customTitle)
            ? customTitle
            : $"Follow up with lead: {lead.Name}";

        var task = new TaskModel
        {
            WorkspaceId = user.WorkspaceId!.Value,
            Workspace = user.Workspace!,
            Title = title,
            Description = $"Automated task created from Lead #{lead.Id} ({lead.Name} - {lead.Email}). Phone: {lead.Phone ?? "N/A"}",
            AssignedToId = lead.AssignedToId ?? user.Id,
            AssignedById = user.Id,
            DueDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1)),
            Priority = "High",
            Status = "Pending",
            AssignedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };

        _context.Tasks.Add(task);
        await _context.SaveChangesAsync();

        return ConvertToDto(task);
    }

    public async Task<TaskDto> UpdateTaskStatusAsync(long taskId, string status, string userEmail)
    {
        var email = userEmail.Trim().ToLower();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null)
        {
            throw new KeyNotFoundException("User not found");
        }

        var task = await _context.Tasks
            .Include(t => t.AssignedTo)
            .Include(t => t.AssignedBy)
            .FirstOrDefaultAsync(t => t.Id == taskId);

        if (task == null)
        {
            throw new ArgumentException("Task not found");
        }

        task.Status = status;
        await _context.SaveChangesAsync();

        return ConvertToDto(task);
    }

    public async Task DeleteTaskAsync(long taskId, string userEmail)
    {
        var task = await _context.Tasks.FirstOrDefaultAsync(t => t.Id == taskId);
        if (task == null)
        {
            throw new ArgumentException("Task not found");
        }

        _context.Tasks.Remove(task);
        await _context.SaveChangesAsync();
    }

    public async Task<List<TaskDto>> BulkAssignTasksAsync(List<long> taskIds, long userId, string userEmail)
    {
        var email = userEmail.Trim().ToLower();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null)
        {
            throw new KeyNotFoundException("User not found");
        }

        var updated = new List<TaskDto>();
        foreach (var id in taskIds)
        {
            var task = await _context.Tasks
                .Include(t => t.AssignedTo)
                .Include(t => t.AssignedBy)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (task != null && task.WorkspaceId == user.WorkspaceId)
            {
                User? assignTarget = userId == -1
                    ? await FindBestTaskAssigneeAsync(user.Workspace!)
                    : await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);

                if (assignTarget != null)
                {
                    task.AssignedToId = assignTarget.Id;
                    task.AssignedTo = assignTarget;
                    task.AssignedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();

                    var assignment = new TaskAssignment
                    {
                        TaskId = task.Id,
                        UserId = assignTarget.Id,
                        AssignedAt = DateTime.UtcNow
                    };
                    _context.TaskAssignments.Add(assignment);
                    await _context.SaveChangesAsync();

                    updated.Add(ConvertToDto(task));
                }
            }
        }

        return updated;
    }

    public async Task<List<TaskDto>> BulkRandomAssignTasksAsync(List<long> taskIds, string userEmail)
    {
        return await BulkAssignTasksAsync(taskIds, -1, userEmail);
    }

    public async Task<List<TaskDto>> BulkUpdateStatusAsync(List<long> taskIds, string status, string userEmail)
    {
        var email = userEmail.Trim().ToLower();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null)
        {
            throw new KeyNotFoundException("User not found");
        }

        var updated = new List<TaskDto>();
        foreach (var id in taskIds)
        {
            var task = await _context.Tasks
                .Include(t => t.AssignedTo)
                .Include(t => t.AssignedBy)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (task != null && task.WorkspaceId == user.WorkspaceId)
            {
                task.Status = status;
                await _context.SaveChangesAsync();
                updated.Add(ConvertToDto(task));
            }
        }

        return updated;
    }

    public async Task<TaskDto> AutoAssignTaskAsync(long taskId, string userEmail)
    {
        var email = userEmail.Trim().ToLower();
        var user = await _context.Users
            .Include(u => u.Workspace)
            .FirstOrDefaultAsync(u => u.Email == email);

        if (user == null)
        {
            throw new KeyNotFoundException("User not found");
        }

        var task = await _context.Tasks
            .Include(t => t.AssignedTo)
            .Include(t => t.AssignedBy)
            .FirstOrDefaultAsync(t => t.Id == taskId);

        if (task == null)
        {
            throw new ArgumentException("Task not found");
        }

        var bestAssignee = await FindBestTaskAssigneeAsync(user.Workspace!);
        if (bestAssignee != null)
        {
            task.AssignedToId = bestAssignee.Id;
            task.AssignedTo = bestAssignee;
            task.AssignedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            var assignment = new TaskAssignment
            {
                TaskId = task.Id,
                UserId = bestAssignee.Id,
                AssignedAt = DateTime.UtcNow
            };
            _context.TaskAssignments.Add(assignment);
            await _context.SaveChangesAsync();

            return ConvertToDto(task);
        }
        else
        {
            throw new InvalidOperationException("No eligible users for task auto-assignment");
        }
    }

    public async Task<TaskDto> ApproveTaskAsync(long taskId, string userEmail)
    {
        return await UpdateTaskStatusAsync(taskId, "APPROVED", userEmail);
    }

    public async Task<TaskDto> RejectTaskAsync(long taskId, string userEmail)
    {
        return await UpdateTaskStatusAsync(taskId, "REJECTED", userEmail);
    }

    public async Task<TaskDto> SuspendTaskAsync(long taskId, string userEmail)
    {
        return await UpdateTaskStatusAsync(taskId, "SUSPENDED", userEmail);
    }

    public async Task<TaskDto> ReassignTaskAsync(long taskId, long userId, string userEmail)
    {
        var email = userEmail.Trim().ToLower();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null)
        {
            throw new KeyNotFoundException("User not found");
        }

        var task = await _context.Tasks
            .Include(t => t.AssignedTo)
            .Include(t => t.AssignedBy)
            .FirstOrDefaultAsync(t => t.Id == taskId);

        if (task == null)
        {
            throw new ArgumentException("Task not found");
        }

        var targetUser = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (targetUser == null)
        {
            throw new ArgumentException("Target user not found");
        }

        task.AssignedToId = targetUser.Id;
        task.AssignedTo = targetUser;
        task.AssignedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        var assignment = new TaskAssignment
        {
            TaskId = task.Id,
            UserId = targetUser.Id,
            AssignedAt = DateTime.UtcNow
        };
        _context.TaskAssignments.Add(assignment);
        await _context.SaveChangesAsync();

        return ConvertToDto(task);
    }

    public async Task<TaskDto> RescheduleTaskAsync(long taskId, RescheduleTaskRequest request, string userEmail)
    {
        var email = userEmail.Trim().ToLower();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null)
        {
            throw new KeyNotFoundException("User not found");
        }

        var task = await _context.Tasks
            .Include(t => t.AssignedTo)
            .Include(t => t.AssignedBy)
            .FirstOrDefaultAsync(t => t.Id == taskId);

        if (task == null)
        {
            throw new ArgumentException("Task not found");
        }

        var history = new TaskRescheduleHistory
        {
            TaskId = task.Id,
            RescheduledById = user.Id,
            OldDueDate = task.DueDate,
            NewDueDate = request.NewDueDate,
            Reason = request.Notes,
            RescheduledAt = DateTime.UtcNow
        };
        _context.ScheduledTasks.Add(history);

        task.DueDate = request.NewDueDate;
        if (!string.IsNullOrWhiteSpace(request.DueTime)) task.DueTime = request.DueTime;
        if (!string.IsNullOrWhiteSpace(request.Notes)) task.RescheduleNotes = request.Notes;
        task.RescheduleCount += 1;

        await _context.SaveChangesAsync();
        return ConvertToDto(task);
    }

    public async Task HandleUserOfflineAsync(long userId)
    {
        var user = await _context.Users
            .Include(u => u.Workspace)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null || user.WorkspaceId == null) return;

        var pendingTasks = await _context.Tasks
            .Where(t => t.AssignedToId == userId && (t.Status == "Pending" || t.Status == "PENDING" || t.Status == "In_Progress" || t.Status == "IN_PROGRESS"))
            .ToListAsync();

        foreach (var task in pendingTasks)
        {
            var newAssignee = await FindBestTaskAssigneeAsync(user.Workspace!);
            if (newAssignee != null && newAssignee.Id != userId)
            {
                task.AssignedToId = newAssignee.Id;
                task.AssignedTo = newAssignee;
                task.AssignedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }
    }

    private async Task<User?> FindBestTaskAssigneeAsync(Workspace workspace)
    {
        var members = await _context.Users
            .Where(u => u.WorkspaceId == workspace.Id && !string.Equals("SUSPENDED", u.Status))
            .Where(u => !string.Equals("OFFLINE", u.AvailabilityStatus) && !string.Equals("ON_LEAVE", u.AvailabilityStatus))
            .ToListAsync();

        if (members.Count == 0) return null;

        var sorted = members
            .OrderBy(u => u.LastAssignedAt ?? DateTime.MinValue)
            .ToList();

        return sorted[0];
    }

    private static bool IsUserOnly(User user)
    {
        if (user == null || user.Roles == null || user.Roles.Count == 0) return true;
        return user.Roles.All(r => !r.Name.Contains("ADMIN", StringComparison.OrdinalIgnoreCase) && !r.Name.Contains("MANAGER", StringComparison.OrdinalIgnoreCase));
    }

    private static TaskDto ConvertToDto(TaskModel task)
    {
        return new TaskDto
        {
            Id = task.Id,
            WorkspaceId = task.WorkspaceId,
            Title = task.Title,
            Description = task.Description,
            AssignedToId = task.AssignedToId,
            AssignedToName = task.AssignedTo != null ? task.AssignedTo.FullName : "Unassigned",
            AssignedById = task.AssignedById,
            AssignedByName = task.AssignedBy != null ? task.AssignedBy.FullName : "System",
            DueDate = task.DueDate,
            DueTime = task.DueTime,
            ReminderMinutes = task.ReminderMinutes,
            RescheduleCount = task.RescheduleCount,
            RescheduleNotes = task.RescheduleNotes,
            Priority = task.Priority ?? "Medium",
            Status = task.Status ?? "Pending",
            AssignedAt = task.AssignedAt,
            CreatedAt = task.CreatedAt
        };
    }
}
