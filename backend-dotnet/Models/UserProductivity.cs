using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LeadGrowth.Models;

[Table("user_productivity")]
public class UserProductivity
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
    public DateOnly Date { get; set; }

    [Column("tasks_completed")]
    public int TasksCompleted { get; set; } = 0;

    [Column("calls_made")]
    public int CallsMade { get; set; } = 0;

    [Column("leads_converted")]
    public int LeadsConverted { get; set; } = 0;

    public int Score { get; set; } = 0;
}
