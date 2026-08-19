using System.ComponentModel.DataAnnotations;

namespace LeadGrowth.DTOs;

public class CalendarEventDto
{
    public long Id { get; set; }
    public long WorkspaceId { get; set; }
    public long? LeadId { get; set; }
    public string? LeadName { get; set; }
    public long? UserId { get; set; }
    public long? AssignedUserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string EventType { get; set; } = "MEETING";
    public bool ReminderSent { get; set; }
    public int ReminderMinutes { get; set; } = 15;
    public string Status { get; set; } = "SCHEDULED";
    public DateTime CreatedAt { get; set; }
}

public class CreateCalendarEventRequest
{
    public long? LeadId { get; set; }
    public long? AssignedUserId { get; set; }
    [Required]
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    [Required]
    public DateTime StartTime { get; set; }
    [Required]
    public DateTime EndTime { get; set; }
    public string EventType { get; set; } = "MEETING";
    public int ReminderMinutes { get; set; } = 15;
}

public class CallSessionDto
{
    public long Id { get; set; }
    public long WorkspaceId { get; set; }
    public long LeadId { get; set; }
    public string? LeadName { get; set; }
    public string? LeadPhone { get; set; }
    public string? LeadCompany { get; set; }
    public long UserId { get; set; }
    public string? UserName { get; set; }
    public string? UserEmail { get; set; }
    public string Status { get; set; } = "ACTIVE";
    public string CallStatus => Status;
    public long DurationSeconds { get; set; }
    public double DurationMinutes { get; set; }
    public string FormattedDuration { get; set; } = "00:00:00";
    public DateTime StartTime { get; set; }
    public DateTime StartedAt => StartTime;
    public DateTime? EndTime { get; set; }
    public DateTime? EndedAt => EndTime;
    public string? Notes { get; set; }
    public DateTime? CreatedAt { get; set; }
}

public class CallAnalyticsDto
{
    public int TotalCalls { get; set; }
    public long TotalDurationSeconds { get; set; }
    public double AverageDurationSeconds { get; set; }
    public int CompletedCalls { get; set; }
    public int MissedCalls { get; set; }
    public long TodayCallTimeSeconds { get; set; }
    public string TodayCallTimeFormatted { get; set; } = "00:00:00";
    public int TodayCallsCount { get; set; }
    public string AvgDurationFormatted { get; set; } = "00:00:00";
    public long LongestCallSeconds { get; set; }
    public string LongestCallFormatted { get; set; } = "00:00:00";
    public CallSessionDto? ActiveCallSession { get; set; }
    public List<CallSessionDto> RecentCalls { get; set; } = new();
}

public class FollowupDto
{
    public long Id { get; set; }
    public long WorkspaceId { get; set; }
    public long LeadId { get; set; }
    public string? LeadName { get; set; }
    public long? AssignedToId { get; set; }
    public string? AssignedToName { get; set; }
    public DateTime ScheduledAt { get; set; }
    public string Type { get; set; } = "CALL";
    public string? Notes { get; set; }
    public string Status { get; set; } = "UPCOMING";
    public bool ConflictFlag { get; set; }
    public string? Outcome { get; set; }
    public string? Remarks { get; set; }
    public DateTime CreatedAt { get; set; }
}
