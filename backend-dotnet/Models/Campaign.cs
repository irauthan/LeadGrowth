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

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
