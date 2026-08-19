using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LeadGrowth.Models;

[Table("sync_logs")]
public class SyncLog
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public long Id { get; set; }

    [Required]
    [Column("workspace_id")]
    public long WorkspaceId { get; set; }

    [ForeignKey("WorkspaceId")]
    public virtual Workspace Workspace { get; set; } = null!;

    [MaxLength(50)]
    public string Platform { get; set; } = string.Empty;

    [MaxLength(20)]
    public string Status { get; set; } = "SUCCESS";

    [Column(TypeName = "TEXT")]
    public string? Details { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
