using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;

namespace LeadGrowth.Models;

[Table("leads")]
public class Lead
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

    [Column("campaign_id")]
    public long? CampaignId { get; set; }

    [ForeignKey("CampaignId")]
    [ValidateNever]
    [JsonIgnore]
    public virtual Campaign? Campaign { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Email { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? Phone { get; set; }

    [Column("source_platform")]
    [MaxLength(50)]
    public string? SourcePlatform { get; set; }

    [Column("campaign_name")]
    [MaxLength(100)]
    public string? CampaignName { get; set; }

    [MaxLength(50)]
    public string? Status { get; set; }

    [Column("assigned_to_id")]
    public long? AssignedToId { get; set; }

    [ForeignKey("AssignedToId")]
    [ValidateNever]
    [JsonIgnore]
    public virtual User? AssignedTo { get; set; }

    [Column("quality_score")]
    public int? QualityScore { get; set; }

    [Column("quality_tier")]
    [MaxLength(20)]
    public string? QualityTier { get; set; }

    [Column("conversion_probability")]
    public double? ConversionProbability { get; set; }

    [Column("queue_status")]
    [MaxLength(30)]
    public string? QueueStatus { get; set; }

    [MaxLength(100)]
    public string? Company { get; set; }

    [MaxLength(100)]
    public string? Location { get; set; }

    [MaxLength(20)]
    public string? Priority { get; set; } = "MEDIUM";

    [Column("assigned_by_id")]
    public long? AssignedById { get; set; }

    [ForeignKey("AssignedById")]
    [ValidateNever]
    [JsonIgnore]
    public virtual User? AssignedBy { get; set; }

    [Column("assigned_date")]
    public DateTime? AssignedDate { get; set; }

    [Column("progress_percentage")]
    public int? ProgressPercentage { get; set; } = 0;

    [Column("last_followup_date")]
    public DateTime? LastFollowupDate { get; set; }

    [Column("due_date")]
    public DateTime? DueDate { get; set; }

    [Column("client_notes", TypeName = "TEXT")]
    public string? ClientNotes { get; set; }

    [Column("proposal_amount")]
    public double? ProposalAmount { get; set; }

    [Column("proposal_status")]
    [MaxLength(30)]
    public string? ProposalStatus { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
