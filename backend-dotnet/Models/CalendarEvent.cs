using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LeadGrowth.Models;

[Table("calendar_events")]
public class CalendarEvent
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public long Id { get; set; }

    [Required]
    [Column("workspace_id")]
    public long WorkspaceId { get; set; }

    [ForeignKey("WorkspaceId")]
    public virtual Workspace Workspace { get; set; } = null!;

    [Column("lead_id")]
    public long? LeadId { get; set; }

    [ForeignKey("LeadId")]
    public virtual Lead? Lead { get; set; }

    [Column("assigned_user_id")]
    public long? AssignedUserId { get; set; }

    [ForeignKey("AssignedUserId")]
    public virtual User? AssignedUser { get; set; }

    [Required]
    [MaxLength(150)]
    public string Title { get; set; } = string.Empty;

    [Column(TypeName = "TEXT")]
    public string? Description { get; set; }

    [Required]
    [Column("start_time")]
    public DateTime StartTime { get; set; }

    [Required]
    [Column("end_time")]
    public DateTime EndTime { get; set; }

    [Column("event_type")]
    [MaxLength(50)]
    public string EventType { get; set; } = "MEETING";

    [Column("reminder_sent")]
    public bool ReminderSent { get; set; } = false;

    [Column("reminder_minutes")]
    public int ReminderMinutes { get; set; } = 15;

    [Required]
    [MaxLength(30)]
    public string Status { get; set; } = "SCHEDULED";

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
