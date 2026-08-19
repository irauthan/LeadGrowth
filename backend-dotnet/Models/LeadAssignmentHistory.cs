using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;

namespace LeadGrowth.Models;

[Table("lead_assignment_history")]
public class LeadAssignmentHistory
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

    [Column("assigned_by_id")]
    public long? AssignedById { get; set; }

    [ForeignKey("AssignedById")]
    [ValidateNever]
    [JsonIgnore]
    public virtual User? AssignedBy { get; set; }

    [Column("assigned_to_id")]
    public long? AssignedToId { get; set; }

    [ForeignKey("AssignedToId")]
    [ValidateNever]
    [JsonIgnore]
    public virtual User? AssignedTo { get; set; }

    [Column("reason", TypeName = "TEXT")]
    public string? Reason { get; set; }

    [Column("assigned_at")]
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
}
