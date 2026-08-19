using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;

namespace LeadGrowth.Models;

[Table("lead_history")]
public class LeadHistory
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
    [Column("action")]
    [MaxLength(100)]
    public string Action { get; set; } = string.Empty;

    [Column("description", TypeName = "TEXT")]
    public string? Description { get; set; }

    [Column("performed_by_id")]
    public long? PerformedById { get; set; }

    [ForeignKey("PerformedById")]
    [ValidateNever]
    [JsonIgnore]
    public virtual User? PerformedBy { get; set; }

    [Column("previous_status")]
    [MaxLength(50)]
    public string? PreviousStatus { get; set; }

    [Column("new_status")]
    [MaxLength(50)]
    public string? NewStatus { get; set; }

    [Column("timestamp")]
    public DateTime? Timestamp { get; set; } = DateTime.UtcNow;
}
