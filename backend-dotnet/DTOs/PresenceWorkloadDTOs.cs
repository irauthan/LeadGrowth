namespace LeadGrowth.DTOs;

public class UserPresenceDto
{
    public long UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Designation { get; set; }
    public string? Department { get; set; }
    public string Role { get; set; } = "USER";
    public string EffectivePresence { get; set; } = "AVAILABLE"; // AVAILABLE, BUSY, ON_BREAK, OFFLINE, ON_LEAVE
    public string StatusSource { get; set; } = "SYSTEM"; // SYSTEM, USER, ADMIN
    public string? StatusReason { get; set; }
    public DateTime? StatusExpiresAtUtc { get; set; }
    public int? RemainingMinutes { get; set; }
    public bool IsLocked { get; set; } = false;
    public string? LockReason { get; set; }
    public double WorkloadScore { get; set; } = 0.0;
    public string WorkloadStatus { get; set; } = "NORMAL"; // NORMAL, HIGH, FULL
    public int ActiveLeadCount { get; set; } = 0;
    public int MaxCapacity { get; set; } = 30;
    public int RemainingCapacity { get; set; } = 30;
    public int ValidFollowupCount { get; set; } = 0;
    public bool CanReceiveLeads { get; set; } = true;
    public DateTime? LastHeartbeatAtUtc { get; set; }
    public DateTime? LastAssignedAtUtc { get; set; }
}

public class ManualBusyRequest
{
    public int DurationMinutes { get; set; } = 30; // 15, 30, 60
    public string Reason { get; set; } = "Focus work"; // "Active client call", "Internal meeting", "Focus work", "Technical issue", "Other"
    public string? CustomReason { get; set; }
}

public class BreakRequest
{
    public int DurationMinutes { get; set; } = 15; // 15 to 30
    public string? Reason { get; set; } = "Short Break";
}

public class AdminStatusOverrideRequest
{
    public long TargetUserId { get; set; }
    public string NewStatus { get; set; } = "AVAILABLE"; // AVAILABLE, BUSY, ON_BREAK, OFFLINE
    public string Reason { get; set; } = string.Empty; // Mandatory
    public int? DurationMinutes { get; set; }
}

public class LeaveRequestCreateDto
{
    public DateTime StartAtUtc { get; set; }
    public DateTime EndAtUtc { get; set; }
    public string Reason { get; set; } = string.Empty;
}

public class LeaveRequestReviewDto
{
    public bool Approve { get; set; }
    public string? ReviewNote { get; set; }
}

public class LeaveRequestDto
{
    public long Id { get; set; }
    public long WorkspaceId { get; set; }
    public long UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public DateTime StartAtUtc { get; set; }
    public DateTime EndAtUtc { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string Status { get; set; } = "PENDING"; // PENDING, APPROVED, REJECTED, CANCELLED
    public DateTime RequestedAtUtc { get; set; }
    public DateTime? ReviewedAtUtc { get; set; }
    public long? ReviewedById { get; set; }
    public string? ReviewedByName { get; set; }
    public string? ReviewNote { get; set; }
}

public class BulkAssignPreviewRequest
{
    public List<long> LeadIds { get; set; } = new();
}

public class EligibleUserPreviewDto
{
    public long UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = "USER";
    public string PresenceStatus { get; set; } = "AVAILABLE";
    public double CurrentWorkloadScore { get; set; }
    public string CurrentWorkloadStatus { get; set; } = "NORMAL";
    public int CurrentActiveLeads { get; set; }
    public int MaxCapacity { get; set; }
    public int RemainingCapacity { get; set; }
    public int ProjectedAssignedCount { get; set; }
    public double ProjectedWorkloadScore { get; set; }
    public string ProjectedWorkloadStatus { get; set; } = "NORMAL";
    public DateTime? LastAssignedAt { get; set; }
}

public class ExcludedUserPreviewDto
{
    public long UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = "USER";
    public string PresenceStatus { get; set; } = "OFFLINE";
    public string WorkloadStatus { get; set; } = "NORMAL";
    public int ActiveLeadCount { get; set; }
    public int MaxCapacity { get; set; }
    public string Reason { get; set; } = string.Empty;
}

public class BulkAssignPreviewResponse
{
    public int TotalSelectedLeads { get; set; }
    public int TotalEligibleCapacity { get; set; }
    public int ProjectedAssignedLeads { get; set; }
    public int ProjectedUnassignedLeads { get; set; }
    public List<EligibleUserPreviewDto> EligibleUsers { get; set; } = new();
    public List<ExcludedUserPreviewDto> ExcludedUsers { get; set; } = new();
}

public class BulkAutoAssignRequest
{
    public List<long> LeadIds { get; set; } = new();
}

public class BulkManualAssignRequest
{
    public List<long> LeadIds { get; set; } = new();
    public long TargetUserId { get; set; }
    public string? OverrideReason { get; set; }
}

public class BulkScheduleJobRequest
{
    public List<long> LeadIds { get; set; } = new();
    public string AssignmentMethod { get; set; } = "AUTO"; // AUTO, MANUAL
    public long? TargetUserId { get; set; }
    public DateTime ScheduledAtUtc { get; set; }
}

public class BulkAssignmentJobDto
{
    public long Id { get; set; }
    public long WorkspaceId { get; set; }
    public long CreatedByAdminId { get; set; }
    public string CreatedByAdminName { get; set; } = string.Empty;
    public string AssignmentMethod { get; set; } = "AUTO";
    public long? TargetUserId { get; set; }
    public string? TargetUserName { get; set; }
    public int TotalLeadCount { get; set; }
    public int AssignedCount { get; set; }
    public int UnassignedCount { get; set; }
    public DateTime? ScheduledAtUtc { get; set; }
    public DateTime? StartedAtUtc { get; set; }
    public DateTime? CompletedAtUtc { get; set; }
    public string Status { get; set; } = "PENDING";
    public string? FailureSummary { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}

public class BulkAssignExecutionResult
{
    public long? JobId { get; set; }
    public int TotalLeads { get; set; }
    public int AssignedCount { get; set; }
    public int UnassignedCount { get; set; }
    public string Status { get; set; } = "COMPLETED"; // COMPLETED, PARTIALLY_COMPLETED, FAILED
    public List<LeadDto> AssignedLeads { get; set; } = new();
    public Dictionary<string, int> UserAssignmentCounts { get; set; } = new();
    public string? FailureSummary { get; set; }
}
