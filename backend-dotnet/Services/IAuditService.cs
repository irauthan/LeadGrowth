using LeadGrowth.Models;

namespace LeadGrowth.Services;

public interface IAuditService
{
    Task LogActionAsync(Workspace workspace, User user, string action, string targetType, long? targetId, string description);
    Task<List<AuditLog>> GetAuditLogsAsync(string email);
}
