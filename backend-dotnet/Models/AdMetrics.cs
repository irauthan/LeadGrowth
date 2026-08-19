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

    [Required]
    public DateOnly Date { get; set; }
}
