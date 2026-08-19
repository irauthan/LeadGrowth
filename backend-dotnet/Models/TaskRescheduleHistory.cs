using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LeadGrowth.Models;

[Table("scheduled_tasks")]
public class TaskRescheduleHistory
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public long Id { get; set; }

    [Required]
    [Column("task_id")]
    public long TaskId { get; set; }

    [ForeignKey("TaskId")]
    public virtual TaskModel Task { get; set; } = null!;

    [Column("rescheduled_by_id")]
    public long? RescheduledById { get; set; }

    [ForeignKey("RescheduledById")]
    public virtual User? RescheduledBy { get; set; }

    [Column("old_due_date")]
    public DateOnly? OldDueDate { get; set; }

    [Column("new_due_date")]
    public DateOnly? NewDueDate { get; set; }

    [Column("reason", TypeName = "TEXT")]
    public string? Reason { get; set; }

    [Column("rescheduled_at")]
    public DateTime RescheduledAt { get; set; } = DateTime.UtcNow;
}
