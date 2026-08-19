using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LeadGrowth.Models;

[Table("workspaces")]
public class Workspace
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public long Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Column("company_name")]
    [MaxLength(100)]
    public string? CompanyName { get; set; }

    [MaxLength(50)]
    public string? Industry { get; set; }

    [Column("team_size")]
    public int? TeamSize { get; set; }

    [MaxLength(100)]
    public string? Website { get; set; }

    [MaxLength(50)]
    public string? Timezone { get; set; }

    [Required]
    [Column("invite_code")]
    [MaxLength(50)]
    public string InviteCode { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Slug { get; set; } = string.Empty;

    [Required]
    [Column("subscription_plan")]
    [MaxLength(30)]
    public string SubscriptionPlan { get; set; } = "PROFESSIONAL";

    [Column("max_users")]
    public int MaxUsers { get; set; } = 25;

    [Column("max_leads")]
    public int MaxLeads { get; set; } = 10000;

    [Column("max_storage_mb")]
    public int MaxStorageMb { get; set; } = 5000;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
