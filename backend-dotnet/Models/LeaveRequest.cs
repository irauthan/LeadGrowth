using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;

namespace LeadGrowth.Models;

[Table("leave_requests")]
public class LeaveRequest
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
    [Column("user_id")]
    public long UserId { get; set; }

    [ForeignKey("UserId")]
    [ValidateNever]
    public virtual User? User { get; set; }

    [Required]
    [Column("start_at_utc")]
    public DateTime StartAtUtc { get; set; }

    [Required]
    [Column("end_at_utc")]
    public DateTime EndAtUtc { get; set; }

    [Required]
    [MaxLength(255)]
    [Column("reason")]
    public string Reason { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    [Column("status")]
    public string Status { get; set; } = "PENDING"; // PENDING, APPROVED, REJECTED, CANCELLED

    [Column("requested_at_utc")]
    public DateTime RequestedAtUtc { get; set; } = DateTime.UtcNow;

    [Column("reviewed_at_utc")]
    public DateTime? ReviewedAtUtc { get; set; }

    [Column("reviewed_by_id")]
    public long? ReviewedById { get; set; }

    [ForeignKey("ReviewedById")]
    [ValidateNever]
    public virtual User? ReviewedBy { get; set; }

    [Column("review_note", TypeName = "TEXT")]
    public string? ReviewNote { get; set; }
}
