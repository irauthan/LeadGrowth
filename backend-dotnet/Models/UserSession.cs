using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LeadGrowth.Models;

[Table("user_sessions")]
public class UserSession
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public long Id { get; set; }

    [Required]
    [Column("user_id")]
    public long UserId { get; set; }

    [ForeignKey("UserId")]
    public virtual User? User { get; set; }

    [Column("ip_address")]
    [MaxLength(45)]
    public string? IpAddress { get; set; }

    [Column("user_agent")]
    [MaxLength(255)]
    public string? UserAgent { get; set; }

    [Column("login_time")]
    public DateTime LoginTime { get; set; } = DateTime.UtcNow;

    [Column("last_active_time")]
    public DateTime LastActiveTime { get; set; } = DateTime.UtcNow;

    [Column("is_expired")]
    public bool IsExpired { get; set; } = false;
}
