using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;

namespace LeadGrowth.Models;

[Table("sales_activities")]
public class SalesActivity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public long Id { get; set; }

    [Required]
    [Column("lead_id")]
    public long LeadId { get; set; }

    [ForeignKey("LeadId")]
    [ValidateNever]
    [JsonIgnore]
    public virtual Lead? Lead { get; set; }

    [Required]
    [Column("activity_key")]
    [MaxLength(50)]
    public string ActivityName { get; set; } = string.Empty;

    [Required]
    [Column("title")]
    [MaxLength(100)]
    public string Title { get; set; } = string.Empty;

    [Column("status")]
    [MaxLength(20)]
    public string Status { get; set; } = "PENDING";

    [Column("completed_at")]
    public DateTime? CompletedAt { get; set; }

    [Column("completed_by_id")]
    public long? CompletedById { get; set; }

    [ForeignKey("CompletedById")]
    [ValidateNever]
    [JsonIgnore]
    public virtual User? CompletedBy { get; set; }

    [Column("completion_remarks", TypeName = "TEXT")]
    public string? CompletionRemarks { get; set; }

    [Column("remarks", TypeName = "TEXT")]
    public string? Remarks { get; set; }

    [Column("created_at")]
    public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;

    [ValidateNever]
    [JsonIgnore]
    public virtual ICollection<SalesActivityLog> Logs { get; set; } = new List<SalesActivityLog>();
}
