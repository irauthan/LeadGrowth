using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LeadGrowth.Models;

[Table("integrations")]
public class Integration
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
    [MaxLength(50)]
    public string Platform { get; set; } = string.Empty;

    [Column("api_key")]
    [MaxLength(255)]
    public string? ApiKey { get; set; }

    [Required]
    [MaxLength(30)]
    public string Status { get; set; } = "Disconnected";

    [Column("last_synced_at")]
    public DateTime? LastSyncedAt { get; set; }
}
