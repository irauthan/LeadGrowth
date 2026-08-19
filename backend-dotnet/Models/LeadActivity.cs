using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LeadGrowth.Models;

[Table("lead_activities")]
public class LeadActivity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public long Id { get; set; }

    [Required]
    [Column("lead_id")]
    public long LeadId { get; set; }

    [ForeignKey("LeadId")]
    public virtual Lead Lead { get; set; } = null!;

    [Required]
    [Column("activity_key")]
    [MaxLength(100)]
    public string ActivityKey { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = "PENDING";

    [Column(TypeName = "TEXT")]
    public string? Remarks { get; set; }

    [Column("completed_at")]
    public DateTime? CompletedAt { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
