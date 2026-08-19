using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;

namespace LeadGrowth.Models;

[Table("call_history")]
public class CallHistory
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public long Id { get; set; }

    [Required]
    [Column("workspace_id")]
    public long WorkspaceId { get; set; }

    [ForeignKey("WorkspaceId")]
    [ValidateNever]
    [JsonIgnore]
    public virtual Workspace? Workspace { get; set; }

    [Required]
    [Column("lead_id")]
    public long LeadId { get; set; }

    [ForeignKey("LeadId")]
    [ValidateNever]
    [JsonIgnore]
    public virtual Lead? Lead { get; set; }

    [Required]
    [Column("user_id")]
    public long UserId { get; set; }

    [ForeignKey("UserId")]
    [ValidateNever]
    [JsonIgnore]
    public virtual User? User { get; set; }

    [Required]
    [Column("start_time")]
    public DateTime StartTime { get; set; } = DateTime.UtcNow;

    [Column("end_time")]
    public DateTime? EndTime { get; set; }

    [Column("duration_seconds")]
    public long? DurationSeconds { get; set; } = 0;

    [Column("duration_minutes")]
    public double? DurationMinutes { get; set; } = 0.0;

    [Column("formatted_duration")]
    [MaxLength(50)]
    public string? FormattedDuration { get; set; }

    [Required]
    [Column("status")]
    [MaxLength(30)]
    public string Status { get; set; } = "ACTIVE";

    [Column("notes", TypeName = "TEXT")]
    public string? Notes { get; set; }

    [Column("created_at")]
    public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; } = DateTime.UtcNow;
}
