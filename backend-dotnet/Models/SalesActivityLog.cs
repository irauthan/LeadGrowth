using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;

namespace LeadGrowth.Models;

[Table("sales_activity_logs")]
public class SalesActivityLog
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public long Id { get; set; }

    [Column("sales_activity_id")]
    public long? SalesActivityId { get; set; }

    [ForeignKey("SalesActivityId")]
    [ValidateNever]
    [JsonIgnore]
    public virtual SalesActivity? SalesActivity { get; set; }

    [Required]
    [Column("lead_id")]
    public long LeadId { get; set; }

    [ForeignKey("LeadId")]
    [ValidateNever]
    [JsonIgnore]
    public virtual Lead? Lead { get; set; }

    [Column("activity_number")]
    public int ActivityNumber { get; set; } = 1;

    [Column("communication_type")]
    [MaxLength(50)]
    public string CommunicationType { get; set; } = "PHONE_CALL";

    [Column("outcome")]
    [MaxLength(50)]
    public string Outcome { get; set; } = "BUSY";

    [Column("remarks", TypeName = "TEXT")]
    public string? Remarks { get; set; }

    [Column("duration")]
    [MaxLength(30)]
    public string? Duration { get; set; }

    [Column("status")]
    [MaxLength(30)]
    public string Status { get; set; } = "ATTEMPTED";

    [Column("next_followup_date")]
    public DateTime? NextFollowupDate { get; set; }

    [Column("attachments", TypeName = "TEXT")]
    public string? Attachments { get; set; }

    [Column("logged_by_id")]
    public long? LoggedById { get; set; }

    [ForeignKey("LoggedById")]
    [ValidateNever]
    [JsonIgnore]
    public virtual User? LoggedBy { get; set; }

    [Column("created_at")]
    public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;
}
