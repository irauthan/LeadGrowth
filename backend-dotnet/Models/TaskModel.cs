using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LeadGrowth.Models;

[Table("tasks")]
public class TaskModel
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public long Id { get; set; }

    [Required]
    [Column("workspace_id")]
    public long WorkspaceId { get; set; }

    [ForeignKey("WorkspaceId")]
    public virtual Workspace Workspace { get; set; } = null!;

    [Required]
    [MaxLength(150)]
    public string Title { get; set; } = string.Empty;

    [Column(TypeName = "TEXT")]
    public string? Description { get; set; }

    [Column("assigned_to_id")]
    public long? AssignedToId { get; set; }

    [ForeignKey("AssignedToId")]
    public virtual User? AssignedTo { get; set; }

    [Column("assigned_by_id")]
    public long? AssignedById { get; set; }

    [ForeignKey("AssignedById")]
    public virtual User? AssignedBy { get; set; }

    [Column("due_date")]
    public DateOnly? DueDate { get; set; }

    [Column("due_time")]
    [MaxLength(20)]
    public string? DueTime { get; set; }

    [Column("reminder_minutes")]
    public int? ReminderMinutes { get; set; }

    [Column("reschedule_count")]
    public int RescheduleCount { get; set; } = 0;

    [Column("reschedule_notes", TypeName = "TEXT")]
    public string? RescheduleNotes { get; set; }

    [MaxLength(20)]
    public string? Priority { get; set; }

    [MaxLength(20)]
    public string? Status { get; set; }

    [Column("assigned_at")]
    public DateTime? AssignedAt { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
