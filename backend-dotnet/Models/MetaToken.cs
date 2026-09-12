using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LeadGrowth.Models;

/// <summary>
/// Persisted Meta access token store (survives restarts, handles long-lived User and Page tokens).
/// </summary>
[Table("meta_tokens")]
public class MetaToken
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public long Id { get; set; }

    /// <summary>
    /// Type of token: "User" (long-lived 60 days) or "Page" (never expires as long as user permissions hold).
    /// </summary>
    [Required]
    [MaxLength(50)]
    [Column("token_type")]
    public string TokenType { get; set; } = "User";

    /// <summary>
    /// The actual Meta access token string.
    /// </summary>
    [Required]
    [Column("access_token", TypeName = "TEXT")]
    public string AccessToken { get; set; } = string.Empty;

    /// <summary>
    /// Calculated expiration timestamp in UTC. Null for non-expiring tokens.
    /// </summary>
    [Column("expires_at")]
    public DateTime? ExpiresAt { get; set; }

    /// <summary>
    /// When the token was last obtained or refreshed.
    /// </summary>
    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
