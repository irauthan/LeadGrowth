using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;

namespace LeadGrowth.Models;

[Table("bulk_assignment_jobs")]
public class BulkAssignmentJob
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
    [Column("created_by_admin_id")]
    public long CreatedByAdminId { get; set; }

    [ForeignKey("CreatedByAdminId")]
    [ValidateNever]
    public virtual User? CreatedByAdmin { get; set; }

    [Required]
    [MaxLength(20)]
    [Column("assignment_method")]
    public string AssignmentMethod { get; set; } = "AUTO"; // AUTO, MANUAL

    [Column("target_user_id")]
    public long? TargetUserId { get; set; }

    [ForeignKey("TargetUserId")]
    [ValidateNever]
    public virtual User? TargetUser { get; set; }

    [Required]
    [Column("lead_ids_json", TypeName = "LONGTEXT")]
    public string LeadIdsJson { get; set; } = "[]";

    [Column("scheduled_at_utc")]
    public DateTime? ScheduledAtUtc { get; set; }

    [Column("started_at_utc")]
    public DateTime? StartedAtUtc { get; set; }

    [Column("completed_at_utc")]
    public DateTime? CompletedAtUtc { get; set; }

    [Required]
    [MaxLength(30)]
    [Column("status")]
    public string Status { get; set; } = "PENDING"; // PENDING, RUNNING, COMPLETED, PARTIALLY_COMPLETED, FAILED, CANCELLED

    [Column("total_lead_count")]
    public int TotalLeadCount { get; set; } = 0;

    [Column("assigned_count")]
    public int AssignedCount { get; set; } = 0;

    [Column("unassigned_count")]
    public int UnassignedCount { get; set; } = 0;

    [Column("failure_summary", TypeName = "TEXT")]
    public string? FailureSummary { get; set; }

    [Column("created_at_utc")]
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
