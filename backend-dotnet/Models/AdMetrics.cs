using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LeadGrowth.Models;

[Table("ad_metrics")]
public class AdMetrics
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public long Id { get; set; }

    [Required]
    [Column("workspace_id")]
    public long WorkspaceId { get; set; }

    [ForeignKey("WorkspaceId")]
    public virtual Workspace Workspace { get; set; } = null!;

    [Column("campaign_id")]
    public long? CampaignId { get; set; }

    [ForeignKey("CampaignId")]
    public virtual Campaign? Campaign { get; set; }

    [Required]
    [MaxLength(50)]
    public string Platform { get; set; } = string.Empty;

    [Column(TypeName = "decimal(12,2)")]
    public decimal Spend { get; set; } = 0;

    public int Clicks { get; set; } = 0;

    public int Impressions { get; set; } = 0;

    public int Conversions { get; set; } = 0;

    [Column("reach")]
    public int Reach { get; set; } = 0;

    [Column("frequency", TypeName = "decimal(6,2)")]
    public decimal Frequency { get; set; } = 1.00m;

    [Column("cpm", TypeName = "decimal(10,2)")]
    public decimal Cpm { get; set; } = 0.00m;

    [Column("cpc", TypeName = "decimal(10,2)")]
    public decimal Cpc { get; set; } = 0.00m;

    [Column("ctr", TypeName = "decimal(6,2)")]
    public decimal Ctr { get; set; } = 0.00m;

    [Column("leads_count")]
    public int LeadsCount { get; set; } = 0;

    [Required]
    public DateOnly Date { get; set; }
}
