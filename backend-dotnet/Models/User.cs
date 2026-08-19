using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace LeadGrowth.Models;

[Table("users")]
public class User
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public long Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MaxLength(255)]
    [JsonIgnore]
    public string Password { get; set; } = string.Empty;

    [Required]
    [Column("full_name")]
    [MaxLength(100)]
    public string FullName { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? Designation { get; set; }

    [Column(TypeName = "TEXT")]
    public string? Bio { get; set; }

    [Column("profile_image", TypeName = "LONGTEXT")]
    public string? ProfileImage { get; set; }

    [MaxLength(20)]
    public string? Phone { get; set; }

    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = "ACTIVE";

    [Column("workspace_id")]
    public long? WorkspaceId { get; set; }

    [ForeignKey("WorkspaceId")]
    public virtual Workspace? Workspace { get; set; }

    public virtual ICollection<Role> Roles { get; set; } = new List<Role>();

    [MaxLength(100)]
    public string? Department { get; set; }

    [Column("last_active_at")]
    public DateTime? LastActiveAt { get; set; }

    [Required]
    [Column("availability_status")]
    [MaxLength(20)]
    public string AvailabilityStatus { get; set; } = "AVAILABLE";

    [Column("last_assigned_at")]
    public DateTime? LastAssignedAt { get; set; }

    [Column("is_email_verified")]
    public bool IsEmailVerified { get; set; } = false;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
