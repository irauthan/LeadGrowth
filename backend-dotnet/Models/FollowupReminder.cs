using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LeadGrowth.Models;

[Table("followup_reminders")]
public class FollowupReminder
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
    [Column("lead_id")]
    public long LeadId { get; set; }

    [ForeignKey("LeadId")]
    public virtual Lead Lead { get; set; } = null!;

    [Column("assigned_to_id")]
    public long? AssignedToId { get; set; }

    [ForeignKey("AssignedToId")]
    public virtual User? AssignedTo { get; set; }

    [Required]
    [Column("scheduled_at")]
    public DateTime ScheduledAt { get; set; }

    [Required]
    [MaxLength(30)]
    public string Type { get; set; } = "CALL";

    [Column(TypeName = "TEXT")]
    public string? Notes { get; set; }

    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = "UPCOMING";

    [NotMapped]
    public bool ConflictFlag { get; set; } = false;

    [Column("outcome")]
    [MaxLength(50)]
    public string? Outcome { get; set; }

    [Column("remarks", TypeName = "TEXT")]
    public string? Remarks { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
