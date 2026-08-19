using LeadGrowth.Data;
using LeadGrowth.Models;
using Microsoft.EntityFrameworkCore;

namespace LeadGrowth.Services;

public class AuditService : IAuditService
{
    private readonly LeadGrowthDbContext _context;

    public AuditService(LeadGrowthDbContext context)
    {
        _context = context;
    }

    public async Task LogActionAsync(Workspace workspace, User user, string action, string targetType, long? targetId, string description)
    {
        var log = new AuditLog
        {
            WorkspaceId = workspace.Id,
            Workspace = workspace,
            UserId = user.Id,
            User = user,
            Action = action,
            TargetType = targetType,
            TargetId = targetId,
            Description = description,
            CreatedAt = DateTime.UtcNow
        };

        _context.AuditLogs.Add(log);
        await _context.SaveChangesAsync();
    }

    public async Task<List<AuditLog>> GetAuditLogsAsync(string email)
    {
        var userEmail = email.Trim().ToLower();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == userEmail);
        if (user == null || user.WorkspaceId == null)
        {
            throw new KeyNotFoundException("User workspace not found");
        }

        return await _context.AuditLogs
            .Include(a => a.User)
            .Where(a => a.WorkspaceId == user.WorkspaceId)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();
    }
}
