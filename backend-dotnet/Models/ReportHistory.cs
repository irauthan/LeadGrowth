using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LeadGrowth.Models;

[Table("report_history")]
public class ReportHistory
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

    [MaxLength(50)]
    public string? Period { get; set; }

    [Column("start_date")]
    public DateOnly? StartDate { get; set; }

    [Column("end_date")]
    public DateOnly? EndDate { get; set; }

    [Required]
    [Column("export_format")]
    [MaxLength(20)]
    public string ExportFormat { get; set; } = "CSV";

    [Required]
    [Column("report_type")]
    [MaxLength(50)]
    public string ReportType { get; set; } = "SUMMARY";

    [Column("file_name")]
    [MaxLength(150)]
    public string? FileName { get; set; }

    [Column("records_exported", TypeName = "TEXT")]
    public string? RecordsExported { get; set; }

    [Column("exported_at")]
    public DateTime ExportedAt { get; set; } = DateTime.UtcNow;
}
