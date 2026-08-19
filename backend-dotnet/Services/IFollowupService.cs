using LeadGrowth.DTOs;

namespace LeadGrowth.Services;

public interface IFollowupService
{
    Task<List<Dictionary<string, object>>> GetFollowupsAsync(string userEmail);
    Task<List<Dictionary<string, object>>> GetTodayFollowupsAsync(string userEmail);
    Task<Dictionary<string, object>> CheckConflictAsync(long userId, string scheduledAt, long? excludeId);
    Task<Dictionary<string, object>> CreateFollowupAsync(long leadId, string userEmail, string scheduledAt, string type, string notes, string? outcome, string? nextFollowupDate, string? remarks, bool autoScheduleIfConflict);
    Task<Dictionary<string, object>> AutoScheduleFollowupAsync(long leadId, string userEmail, string type, string notes);
    Task<List<Dictionary<string, object>>> BulkAutoScheduleAsync(string userEmail, List<long> leadIds);
    Task<Dictionary<string, object>> RescheduleFollowupAsync(long id, string userEmail, string newScheduledAt, bool autoScheduleIfConflict);
    Task<Dictionary<string, object>> CancelFollowupAsync(long id, string userEmail, string reason);
    Task<Dictionary<string, object>> ReassignFollowupAsync(long id, long newUserId, string? newScheduledAt);
    Task<Dictionary<string, object>> CompleteFollowupAsync(long id, string userEmail, string notes);
}
