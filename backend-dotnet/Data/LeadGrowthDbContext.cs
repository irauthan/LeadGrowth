using LeadGrowth.Models;
using Microsoft.EntityFrameworkCore;

namespace LeadGrowth.Data;

public class LeadGrowthDbContext : DbContext
{
    public LeadGrowthDbContext(DbContextOptions<LeadGrowthDbContext> options)
        : base(options)
    {
    }

    public DbSet<Workspace> Workspaces { get; set; } = null!;
    public DbSet<Role> Roles { get; set; } = null!;
    public DbSet<User> Users { get; set; } = null!;
    public DbSet<Campaign> Campaigns { get; set; } = null!;
    public DbSet<Lead> Leads { get; set; } = null!;
    public DbSet<LeadNote> LeadNotes { get; set; } = null!;
    public DbSet<LeadActivity> LeadActivities { get; set; } = null!;
    public DbSet<LeadAssignment> LeadAssignments { get; set; } = null!;
    public DbSet<LeadAssignmentHistory> LeadAssignmentHistories { get; set; } = null!;
    public DbSet<LeadHistory> LeadHistories { get; set; } = null!;
    public DbSet<TaskModel> Tasks { get; set; } = null!;
    public DbSet<TaskAssignment> TaskAssignments { get; set; } = null!;
    public DbSet<TaskRescheduleHistory> ScheduledTasks { get; set; } = null!;
    public DbSet<CalendarEvent> CalendarEvents { get; set; } = null!;
    public DbSet<FollowupReminder> FollowupReminders { get; set; } = null!;
    public DbSet<CallHistory> CallHistories { get; set; } = null!;
    public DbSet<AdMetrics> AdMetrics { get; set; } = null!;
    public DbSet<Integration> Integrations { get; set; } = null!;
    public DbSet<SyncLog> SyncLogs { get; set; } = null!;
    public DbSet<Report> Reports { get; set; } = null!;
    public DbSet<ReportHistory> ReportHistories { get; set; } = null!;
    public DbSet<Notification> Notifications { get; set; } = null!;
    public DbSet<ActivityLog> ActivityLogs { get; set; } = null!;
    public DbSet<AuditLog> AuditLogs { get; set; } = null!;
    public DbSet<AssignmentLog> AssignmentLogs { get; set; } = null!;
    public DbSet<UserProductivity> UserProductivities { get; set; } = null!;
    public DbSet<UserSession> UserSessions { get; set; } = null!;
    public DbSet<Invitation> WorkspaceInvites { get; set; } = null!;
    public DbSet<PasswordResetToken> PasswordResetTokens { get; set; } = null!;
    public DbSet<EmailVerificationToken> EmailVerificationTokens { get; set; } = null!;
    public DbSet<RefreshToken> RefreshTokens { get; set; } = null!;
    public DbSet<SalesActivity> SalesActivities { get; set; } = null!;
    public DbSet<SalesActivityLog> SalesActivityLogs { get; set; } = null!;
    public DbSet<LeaveRequest> LeaveRequests { get; set; } = null!;
    public DbSet<BulkAssignmentJob> BulkAssignmentJobs { get; set; } = null!;
    public DbSet<UserStatusLog> UserStatusLogs { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // 1. Many-to-Many: User <-> Role (user_roles table)
        modelBuilder.Entity<User>()
            .HasMany(u => u.Roles)
            .WithMany(r => r.Users)
            .UsingEntity<Dictionary<string, object>>(
                "user_roles",
                j => j.HasOne<Role>().WithMany().HasForeignKey("role_id"),
                j => j.HasOne<User>().WithMany().HasForeignKey("user_id")
            );

        // 2. Workspace indexes
        modelBuilder.Entity<Workspace>()
            .HasIndex(w => w.InviteCode)
            .IsUnique();

        modelBuilder.Entity<Workspace>()
            .HasIndex(w => w.Slug)
            .IsUnique();

        // 3. User indexes
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        // 4. Role indexes
        modelBuilder.Entity<Role>()
            .HasIndex(r => r.Name)
            .IsUnique();

        // 5. Invitation indexes
        modelBuilder.Entity<Invitation>()
            .HasIndex(i => i.Token)
            .IsUnique();

        // 6. Leave Request indexes
        modelBuilder.Entity<LeaveRequest>()
            .HasIndex(l => new { l.WorkspaceId, l.UserId, l.Status });

        // 7. Bulk Assignment Job indexes
        modelBuilder.Entity<BulkAssignmentJob>()
            .HasIndex(b => new { b.WorkspaceId, b.Status });

        // 8. User Status Log indexes
        modelBuilder.Entity<UserStatusLog>()
            .HasIndex(s => new { s.WorkspaceId, s.UserId, s.CreatedAtUtc });
    }
}
