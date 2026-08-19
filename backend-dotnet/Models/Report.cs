using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LeadGrowth.Models;

[Table("reports")]
public class Report
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public long Id { get; set; }

    [Required]
    [Column("workspace_id")]
    public long WorkspaceId { get; set; }

    [ForeignKey("WorkspaceId")]
    public virtual Workspace Workspace { get; set; } = null!;

    [Required]
    [Column("user_id")]
    public long UserId { get; set; }

    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;

    [Required]
    [Column("report_type")]
    [MaxLength(50)]
    public string ReportType { get; set; } = "DAILY_SALES";

    [MaxLength(50)]
    public string? Period { get; set; }

    [Column("start_date")]
    public DateOnly? StartDate { get; set; }

    [Column("end_date")]
    public DateOnly? EndDate { get; set; }

    [Required]
    [MaxLength(30)]
    public string Status { get; set; } = "PENDING";

    [Column("reviewed_by_id")]
    public long? ReviewedById { get; set; }

    [ForeignKey("ReviewedById")]
    public virtual User? ReviewedBy { get; set; }

    [Column("reviewed_at")]
    public DateTime? ReviewedAt { get; set; }

    [Column("review_comments", TypeName = "TEXT")]
    public string? ReviewComments { get; set; }

    [Column("notes", TypeName = "TEXT")]
    public string? Notes { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
