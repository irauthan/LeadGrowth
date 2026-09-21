using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;

namespace LeadGrowth.Models;

[Table("campaigns")]
public class Campaign
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public long Id { get; set; }

    [Column("workspace_id")]
    public long WorkspaceId { get; set; }

    [ForeignKey("WorkspaceId")]
    [ValidateNever]
    [JsonIgnore]
    public virtual Workspace? Workspace { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string Platform { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? Status { get; set; }

    [Column(TypeName = "decimal(12,2)")]
    public decimal Budget { get; set; } = 0;

    [Column(TypeName = "decimal(12,2)")]
    public decimal Spend { get; set; } = 0;

    public int Clicks { get; set; } = 0;

    public int Impressions { get; set; } = 0;

    [Column("leads_count")]
    public int LeadsCount { get; set; } = 0;

    public int Conversions { get; set; } = 0;

    [Column(TypeName = "decimal(12,2)")]
    public decimal Revenue { get; set; } = 0;

    [Column("external_campaign_id")]
    [MaxLength(64)]
    public string? ExternalCampaignId { get; set; }

    [Column("ad_account_id")]
    [MaxLength(64)]
    public string? AdAccountId { get; set; }

    [Column("objective")]
    [MaxLength(50)]
    public string? Objective { get; set; }

    [Column("is_legacy")]
    public bool IsLegacy { get; set; } = false;

    [Column("last_synced_at")]
    public DateTime? LastSyncedAt { get; set; }

    [Column("sync_status")]
    [MaxLength(30)]
    public string? SyncStatus { get; set; } = "SYNCED";

    [Column("sync_error")]
    public string? SyncError { get; set; }

    [Column("platform_status")]
    [MaxLength(50)]
    public string? PlatformStatus { get; set; }

    [Column("placements")]
    [MaxLength(255)]
    public string? Placements { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

