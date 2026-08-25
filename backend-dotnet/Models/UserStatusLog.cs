using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;

namespace LeadGrowth.Models;

[Table("user_status_logs")]
public class UserStatusLog
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public long Id { get; set; }

    [Required]
    [Column("workspace_id")]
    public long WorkspaceId { get; set; }

    [Required]
    [Column("user_id")]
    public long UserId { get; set; }

    [ForeignKey("UserId")]
    [ValidateNever]
    [JsonIgnore]
    public virtual User? User { get; set; }

    [Required]
    [MaxLength(20)]
    [Column("previous_status")]
    public string PreviousStatus { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    [Column("new_status")]
    public string NewStatus { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    [Column("status_source")]
    public string StatusSource { get; set; } = "SYSTEM"; // SYSTEM, USER, ADMIN

    [MaxLength(255)]
    [Column("reason")]
    public string? Reason { get; set; }

    [Column("changed_by_id")]
    public long? ChangedById { get; set; }

    [ForeignKey("ChangedById")]
    [ValidateNever]
    public virtual User? ChangedBy { get; set; }

    [Column("started_at_utc")]
    public DateTime? StartedAtUtc { get; set; }

    [Column("expires_at_utc")]
    public DateTime? ExpiresAtUtc { get; set; }

    [Column("created_at_utc")]
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
