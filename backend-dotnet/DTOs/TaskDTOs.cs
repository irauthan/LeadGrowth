using System.ComponentModel.DataAnnotations;

namespace LeadGrowth.DTOs;

public class TaskDto
{
    public long Id { get; set; }
    public long WorkspaceId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public long? AssignedToId { get; set; }
    public string? AssignedToName { get; set; }
    public long? AssignedById { get; set; }
    public string? AssignedByName { get; set; }
    public DateOnly? DueDate { get; set; }
    public string? DueTime { get; set; }
    public int? ReminderMinutes { get; set; }
    public int RescheduleCount { get; set; }
    public string? RescheduleNotes { get; set; }
    public string? Priority { get; set; }
    public string? Status { get; set; }
    public DateTime? AssignedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class RescheduleTaskRequest
{
    [Required]
    public DateOnly NewDueDate { get; set; }
    public string? DueTime { get; set; }
    public string? Notes { get; set; }
}
