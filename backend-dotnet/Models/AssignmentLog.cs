using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;

namespace LeadGrowth.Models;

[Table("assignment_logs")]
public class AssignmentLog
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

    [MaxLength(500)]
    public string? Strategy { get; set; }

    [Column("assigned_at")]
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
}
