using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LeadGrowth.Models;

[Table("api_keys")]
public class ApiKey
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public long Id { get; set; }

    [Required]
    [Column("workspace_id")]
    public long WorkspaceId { get; set; }

    [ForeignKey("WorkspaceId")]
    public virtual Workspace? Workspace { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [Column("key_prefix")]
    [MaxLength(20)]
    public string KeyPrefix { get; set; } = string.Empty;

    [Required]
    [Column("key_hash")]
    [MaxLength(255)]
    public string KeyHash { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string Scope { get; set; } = "Full-Access"; // "Full-Access" or "Read-Only"

    [Column("created_by_id")]
    public long? CreatedById { get; set; }

    [Column("created_by_name")]
    [MaxLength(100)]
    public string? CreatedByName { get; set; }

    [Column("last_used_at")]
    public DateTime? LastUsedAt { get; set; }

    [Column("expires_at")]
    public DateTime? ExpiresAt { get; set; }

    [Column("is_revoked")]
    public bool IsRevoked { get; set; } = false;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
