using System.ComponentModel.DataAnnotations;

namespace LeadGrowth.DTOs;

public class LeadDto
{
    public long Id { get; set; }
    public long WorkspaceId { get; set; }
    public long? CampaignId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? SourcePlatform { get; set; }
    public string? CampaignName { get; set; }
    public string? Status { get; set; }
    public long? AssignedToId { get; set; }
    public string? AssignedToName { get; set; }
    public long? AssignedById { get; set; }
    public string? AssignedByName { get; set; }
    public DateTime? AssignedDate { get; set; }
    public int? QualityScore { get; set; }
    public string? QualityTier { get; set; }
    public double? ConversionProbability { get; set; }
    public string? QueueStatus { get; set; }
    public string? Company { get; set; }
    public string? Location { get; set; }
    public string? Priority { get; set; }
    public int? ProgressPercentage { get; set; }
    public DateTime? LastFollowupDate { get; set; }
    public DateTime? DueDate { get; set; }
    public string? ClientNotes { get; set; }
    public double? ProposalAmount { get; set; }
    public string? ProposalStatus { get; set; }
    public DateTime CreatedAt { get; set; }

    public DateTime? NextFollowupDate { get; set; }
    public string? FollowupNotes { get; set; }
    public string? FollowupType { get; set; }
    public string? FollowupStatus { get; set; }
    public List<SalesActivityDto> Activities { get; set; } = new();
}

public class LeadNoteRequest
{
    [Required]
    public string Note { get; set; } = string.Empty;
}

public class ContactRepoDto
{
    public long LeadId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Company { get; set; }
    public string? SourcePlatform { get; set; }
    public string? CurrentStage { get; set; }
    public long? AssignedToId { get; set; }
    public string? AssignedToName { get; set; }
    public int QualityScore { get; set; } = 75;
    public string QualityTier { get; set; } = "WARM";
    public double ConversionProbability { get; set; } = 75.0;
    public DateTime? FirstContactDate { get; set; }
    public DateTime? LastContactDate { get; set; }
    public long TotalCalls { get; set; }
    public long TotalEmails { get; set; }
    public long TotalWhatsApp { get; set; }
    public int TotalInteractionsCount { get; set; }
    public string? LastActivityDescription { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class AddActivityLogRequest
{
    public string? CommunicationType { get; set; }
    public string? Outcome { get; set; }
    public string? Remarks { get; set; }
    public string? Duration { get; set; }
    public string? Status { get; set; }
    public DateTime? NextFollowupDate { get; set; }
    public string? Attachments { get; set; }
    public double? ProposalAmount { get; set; }
    public string? ProposalStatus { get; set; }
}

public class CompleteStepRequest
{
    public string? CompletionRemarks { get; set; }
    public string? Remarks { get; set; }
    public double? ProposalAmount { get; set; }
    public string? ProposalStatus { get; set; }
}

public class SalesActivityLogDto
{
    public long Id { get; set; }
    public long? SalesActivityId { get; set; }
    public long LeadId { get; set; }
    public int ActivityNumber { get; set; }
    public string? ActivityKey { get; set; }
    public string? Action { get; set; }
    public string? CommunicationType { get; set; }
    public string? Outcome { get; set; }
    public string? Remarks { get; set; }
    public string? Duration { get; set; }
    public string? Status { get; set; }
    public DateTime? NextFollowupDate { get; set; }
    public string? Attachments { get; set; }
    public long? LoggedById { get; set; }
    public string? LoggedByName { get; set; }
    public DateTime? CreatedAt { get; set; }

    public SalesActivityLogDto() { }

    public SalesActivityLogDto(long id, long? salesActivityId, long leadId, int activityNumber, string? communicationType, string? outcome, string? remarks, string? duration, string? status, DateTime? nextFollowupDate, string? attachments, long? loggedById, string? loggedByName, DateTime? createdAt)
    {
        Id = id;
        SalesActivityId = salesActivityId;
        LeadId = leadId;
        ActivityNumber = activityNumber;
        CommunicationType = communicationType;
        Outcome = outcome;
        Remarks = remarks;
        Duration = duration;
        Status = status;
        NextFollowupDate = nextFollowupDate;
        Attachments = attachments;
        LoggedById = loggedById;
        LoggedByName = loggedByName;
        CreatedAt = createdAt;
    }
}

public class SalesActivityDto
{
    public long Id { get; set; }
    public long LeadId { get; set; }
    public string ActivityKey { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Status { get; set; } = "PENDING";
    public DateTime? CompletedAt { get; set; }
    public long? CompletedById { get; set; }
    public string? CompletedByName { get; set; }
    public string? CompletionRemarks { get; set; }
    public string? Remarks { get; set; }
    public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;
    public List<SalesActivityLogDto> ActivityLogs { get; set; } = new();
    public List<SalesActivityLogDto> Logs { get; set; } = new();

    public SalesActivityDto() { }

    public SalesActivityDto(long id, long leadId, string activityKey, string title, string status, DateTime? completedAt, long? completedById, string? completedByName, string? completionRemarks, string? remarks, DateTime? createdAt, List<SalesActivityLogDto> activityLogs)
    {
        Id = id;
        LeadId = leadId;
        ActivityKey = activityKey;
        Title = title;
        Status = status;
        CompletedAt = completedAt;
        CompletedById = completedById;
        CompletedByName = completedByName;
        CompletionRemarks = completionRemarks;
        Remarks = remarks;
        CreatedAt = createdAt;
        ActivityLogs = activityLogs;
        Logs = activityLogs;
    }
}

public class LeadHistoryDto
{
    public long Id { get; set; }
    public long LeadId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string? Description { get; set; }
    public long? PerformedById { get; set; }
    public string? PerformedByName { get; set; }
    public string? PreviousStatus { get; set; }
    public string? NewStatus { get; set; }
    public DateTime Timestamp { get; set; }

    public LeadHistoryDto() { }

    public LeadHistoryDto(long id, long leadId, string action, string? description, long? performedById, string? performedByName, string? previousStatus, string? newStatus, DateTime timestamp)
    {
        Id = id;
        LeadId = leadId;
        Action = action;
        Description = description;
        PerformedById = performedById;
        PerformedByName = performedByName;
        PreviousStatus = previousStatus;
        NewStatus = newStatus;
        Timestamp = timestamp;
    }
}

public class BulkAssignPayload
{
    public List<long> LeadIds { get; set; } = new();
    public long TargetUserId { get; set; }
}
