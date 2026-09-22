using System.Text.Json;
using System.Text.Json.Serialization;
using LeadGrowth.BackgroundServices;
using LeadGrowth.Data;
using LeadGrowth.Hubs;
using LeadGrowth.Models;
using LeadGrowth.Security;
using LeadGrowth.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// 1. Connection String & Database Context (EF Core + Pomelo MySQL 8.x)
var connectionString = builder.Configuration.GetConnectionString("LeadGrowthDb") 
    ?? "Server=localhost;Port=3306;Database=leadgrowth;User=root;Password=;";

builder.Services.AddDbContext<LeadGrowthDbContext>(options =>
{
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString));
});

// 2. Security, Realtime & Application Services DI Registration
builder.Services.Configure<MetaAdsOptions>(builder.Configuration.GetSection(MetaAdsOptions.SectionName));
builder.Services.AddHttpClient("MetaGraphApi", client =>
{
    client.Timeout = TimeSpan.FromSeconds(30);
    client.DefaultRequestHeaders.Add("User-Agent", "LeadGrowth-MetaIntegration/1.0");
});

builder.Services.Configure<GoogleAdsOptions>(builder.Configuration.GetSection(GoogleAdsOptions.SectionName));
builder.Services.AddHttpClient("GoogleAdsApi", client =>
{
    client.Timeout = TimeSpan.FromSeconds(60);
    client.DefaultRequestHeaders.Add("User-Agent", "LeadGrowth-GoogleAdsIntegration/1.0");
});
builder.Services.AddHttpClient("GoogleOAuth", client =>
{
    client.Timeout = TimeSpan.FromSeconds(30);
});

builder.Services.AddSingleton<IPasswordHasher, PasswordHasher>();
builder.Services.AddSingleton<IJwtService, JwtService>();
builder.Services.AddSingleton<IWebSocketManagerService, WebSocketManagerService>();
builder.Services.AddSignalR();

builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IWorkspaceService, WorkspaceService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IProductivityService, ProductivityService>();
builder.Services.AddScoped<ILeadService, LeadService>();
builder.Services.AddScoped<ILeadQueueService, LeadQueueService>();
builder.Services.AddScoped<ITaskService, TaskService>();
builder.Services.AddScoped<ICalendarService, CalendarService>();
builder.Services.AddScoped<IFollowupService, FollowupService>();
builder.Services.AddScoped<ICallService, CallService>();
builder.Services.AddScoped<ICampaignService, CampaignService>();
builder.Services.AddScoped<IMetaAdsService, MetaAdsService>();
builder.Services.AddScoped<IGoogleAdsService, GoogleAdsService>();
builder.Services.AddScoped<ISyncService, SyncService>();
builder.Services.AddScoped<IReportService, ReportService>();
builder.Services.AddScoped<IExportService, ExportService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddScoped<IUserAnalyticsService, UserAnalyticsService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IAuditService, AuditService>();
builder.Services.AddScoped<IExecutiveWorkMonitoringService, ExecutiveWorkMonitoringService>();
builder.Services.AddScoped<IUserPresenceService, UserPresenceService>();
builder.Services.AddScoped<ILeaveService, LeaveService>();
builder.Services.AddScoped<IBulkAssignmentService, BulkAssignmentService>();
builder.Services.AddScoped<ILeadImportService, LeadImportService>();

// 2.5 Background Schedulers
builder.Services.Configure<HostOptions>(options =>
{
    options.BackgroundServiceExceptionBehavior = BackgroundServiceExceptionBehavior.Ignore;
});

// builder.Services.AddHostedService<SyncBackgroundService>(); // PAUSED: Meta & Google Ads sync paused while leads are imported via Excel
builder.Services.AddHostedService<CalendarReminderBackgroundService>();
builder.Services.AddHostedService<AutoReassignmentBackgroundService>();

// 3. Controllers & JSON Serialization (camelCase to preserve React contracts)
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

// 4. CORS Configuration
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials()
              .WithExposedHeaders("Authorization", "Content-Disposition");
    });
});

// 5. JWT Authentication & Role Authorization Policies
var jwtSecret = builder.Configuration["Jwt:Secret"] 
    ?? "9a72e811c7d242637a28e3b1c6d3f2349e52c87123d4c67ba567c823ef567df1";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(jwtSecret)),
        ValidateIssuer = false,
        ValidateAudience = false,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("RequireAdmin", policy => policy.RequireRole("ROLE_ADMIN", "ADMIN", "Admin"));
    options.AddPolicy("RequireManagerOrAdmin", policy => policy.RequireRole("ROLE_ADMIN", "ROLE_MANAGER", "ADMIN", "MANAGER", "Admin", "Manager"));
    options.AddPolicy("RequireUser", policy => policy.RequireRole("ROLE_ADMIN", "ROLE_MANAGER", "ROLE_USER", "ADMIN", "MANAGER", "USER", "Admin", "Manager", "User"));
});

var app = builder.Build();

// Configure the HTTP request pipeline
app.UseCors("AllowAll");
app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<LeadHub>("/ws-leads");

// Health check route with live MySQL DB verification
app.MapGet("/api/health", async (LeadGrowthDbContext dbContext) =>
{
    try
    {
        var workspaceCount = await dbContext.Workspaces.CountAsync();
        var userCount = await dbContext.Users.CountAsync();
        var leadCount = await dbContext.Leads.CountAsync();

        return Results.Ok(new
        {
            status = "UP",
            backend = "ASP.NET Core Web API",
            framework = ".NET 10",
            database = "CONNECTED (MySQL 8.x)",
            metrics = new
            {
                workspaces = workspaceCount,
                users = userCount,
                leads = leadCount
            },
            timestamp = DateTime.UtcNow
        });
    }
    catch (Exception ex)
    {
        return Results.Problem(
            detail: $"Database connection error: {ex.Message}",
            statusCode: 500,
            title: "Database Error"
        );
    }
});

// Automatic database schema synchronization / migration for MySQL
try
{
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<LeadGrowthDbContext>();
    var conn = dbContext.Database.GetDbConnection();
    if (conn.State != System.Data.ConnectionState.Open)
    {
        conn.Open();
    }

    void EnsureColumn(string tableName, string columnName, string columnDefinition)
    {
        try
        {
            using var cmd = conn.CreateCommand();
            cmd.CommandText = $"SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = '{tableName}' AND column_name = '{columnName}'";
            var exists = Convert.ToInt32(cmd.ExecuteScalar()) > 0;
            if (!exists)
            {
                using var alterCmd = conn.CreateCommand();
                alterCmd.CommandText = $"ALTER TABLE `{tableName}` ADD COLUMN `{columnName}` {columnDefinition};";
                alterCmd.ExecuteNonQuery();
                Console.WriteLine($"[DB Patch] Added column `{columnName}` to `{tableName}`");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[DB Patch Note for {columnName}]: {ex.Message}");
        }
    }

    void EnsureTable(string tableName, string createTableSql)
    {
        try
        {
            using var cmd = conn.CreateCommand();
            cmd.CommandText = $"SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = '{tableName}'";
            var exists = Convert.ToInt32(cmd.ExecuteScalar()) > 0;
            if (!exists)
            {
                using var createCmd = conn.CreateCommand();
                createCmd.CommandText = createTableSql;
                createCmd.ExecuteNonQuery();
                Console.WriteLine($"[DB Patch] Created table `{tableName}`");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[DB Patch Note for table {tableName}]: {ex.Message}");
        }
    }

    void EnsureIndex(string tableName, string indexName, string columnsSql)
    {
        try
        {
            using var cmd = conn.CreateCommand();
            cmd.CommandText = $"SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = '{tableName}' AND index_name = '{indexName}'";
            var exists = Convert.ToInt32(cmd.ExecuteScalar()) > 0;
            if (!exists)
            {
                using var createCmd = conn.CreateCommand();
                createCmd.CommandText = $"CREATE INDEX `{indexName}` ON `{tableName}` ({columnsSql});";
                createCmd.ExecuteNonQuery();
                Console.WriteLine($"[DB Patch] Created index `{indexName}` on `{tableName}`");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[DB Patch Note for index {indexName}]: {ex.Message}");
        }
    }

    // 1. Add missing columns to users table safely
    EnsureColumn("users", "is_email_verified", "TINYINT(1) NOT NULL DEFAULT 0");
    EnsureColumn("users", "can_receive_leads", "TINYINT(1) NOT NULL DEFAULT 1");
    EnsureColumn("users", "last_heartbeat_at", "DATETIME NULL");
    EnsureColumn("users", "manual_status", "VARCHAR(20) NULL");
    EnsureColumn("users", "manual_status_source", "VARCHAR(20) NULL");
    EnsureColumn("users", "manual_status_reason", "VARCHAR(255) NULL");
    EnsureColumn("users", "manual_status_expires_at", "DATETIME NULL");
    EnsureColumn("users", "max_capacity", "INT NULL DEFAULT 30");
    EnsureColumn("users", "failed_login_attempts", "INT NOT NULL DEFAULT 0");
    EnsureColumn("users", "lockout_end", "DATETIME NULL");

    // 1.1 Add missing columns to leads table safely
    EnsureColumn("leads", "quality_score", "INT NULL");
    EnsureColumn("leads", "quality_tier", "VARCHAR(20) NULL");
    EnsureColumn("leads", "conversion_probability", "DOUBLE NULL");
    EnsureColumn("leads", "queue_status", "VARCHAR(30) NULL");
    EnsureColumn("leads", "company", "VARCHAR(100) NULL");
    EnsureColumn("leads", "location", "VARCHAR(100) NULL");
    EnsureColumn("leads", "priority", "VARCHAR(20) NULL DEFAULT 'MEDIUM'");
    EnsureColumn("leads", "assigned_by_id", "BIGINT NULL");
    EnsureColumn("leads", "assigned_date", "DATETIME NULL");
    EnsureColumn("leads", "progress_percentage", "INT NULL DEFAULT 0");
    EnsureColumn("leads", "last_followup_date", "DATETIME NULL");
    EnsureColumn("leads", "due_date", "DATETIME NULL");
    EnsureColumn("leads", "client_notes", "TEXT NULL");
    EnsureColumn("leads", "proposal_amount", "DOUBLE NULL");
    EnsureColumn("leads", "proposal_status", "VARCHAR(30) NULL");
    EnsureColumn("leads", "external_lead_id", "VARCHAR(64) NULL");
    EnsureColumn("leads", "form_id", "VARCHAR(64) NULL");
    EnsureColumn("leads", "ad_id", "VARCHAR(64) NULL");
    EnsureColumn("leads", "ad_name", "VARCHAR(100) NULL");
    EnsureColumn("leads", "adset_id", "VARCHAR(64) NULL");
    EnsureColumn("leads", "adset_name", "VARCHAR(100) NULL");
    EnsureColumn("leads", "is_organic", "TINYINT(1) NOT NULL DEFAULT 0");
    EnsureColumn("leads", "raw_form_data", "TEXT NULL");
    EnsureColumn("leads", "google_customer_id", "VARCHAR(64) NULL");
    EnsureColumn("leads", "gclid", "VARCHAR(100) NULL");

    // 1.2 Add missing columns to campaigns table safely
    EnsureColumn("campaigns", "external_campaign_id", "VARCHAR(64) NULL");
    EnsureColumn("campaigns", "ad_account_id", "VARCHAR(64) NULL");
    EnsureColumn("campaigns", "objective", "VARCHAR(50) NULL");
    EnsureColumn("campaigns", "leads_count", "INT NOT NULL DEFAULT 0");
    EnsureColumn("campaigns", "is_legacy", "TINYINT(1) NOT NULL DEFAULT 0");
    EnsureColumn("campaigns", "last_synced_at", "DATETIME NULL");
    EnsureColumn("campaigns", "sync_status", "VARCHAR(30) NULL DEFAULT 'SYNCED'");
    EnsureColumn("campaigns", "sync_error", "TEXT NULL");
    EnsureColumn("campaigns", "platform_status", "VARCHAR(50) NULL");
    EnsureColumn("campaigns", "placements", "VARCHAR(255) NULL");

    // 1.3 Add missing columns to followup_reminders table safely
    EnsureColumn("followup_reminders", "outcome", "VARCHAR(50) NULL");
    EnsureColumn("followup_reminders", "remarks", "TEXT NULL");

    // 1.4 Add missing columns to tasks table safely
    EnsureColumn("tasks", "assigned_at", "DATETIME NULL");
    EnsureColumn("tasks", "assigned_by_id", "BIGINT NULL");
    EnsureColumn("tasks", "due_time", "VARCHAR(20) NULL");
    EnsureColumn("tasks", "reminder_minutes", "INT NULL");
    EnsureColumn("tasks", "reschedule_count", "INT NOT NULL DEFAULT 0");
    EnsureColumn("tasks", "reschedule_notes", "TEXT NULL");

    // 1.5 Add missing columns to calendar_events table safely
    EnsureColumn("calendar_events", "reminder_sent", "TINYINT(1) NOT NULL DEFAULT 0");
    EnsureColumn("calendar_events", "reminder_minutes", "INT NOT NULL DEFAULT 15");
    EnsureColumn("calendar_events", "event_type", "VARCHAR(50) NULL DEFAULT 'MEETING'");

    // 1.6 Add missing columns to sales_activities table safely
    EnsureColumn("sales_activities", "completion_remarks", "TEXT NULL");
    EnsureColumn("sales_activities", "remarks", "TEXT NULL");

    // 2. Create new tables only if they don't already exist in the database
    EnsureTable("leave_requests", @"
        CREATE TABLE leave_requests (
            Id BIGINT AUTO_INCREMENT PRIMARY KEY,
            workspace_id BIGINT NOT NULL,
            user_id BIGINT NOT NULL,
            start_at_utc DATETIME NOT NULL,
            end_at_utc DATETIME NOT NULL,
            reason VARCHAR(255) NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
            requested_at_utc DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            reviewed_at_utc DATETIME NULL,
            reviewed_by_id BIGINT NULL,
            review_note TEXT NULL,
            INDEX idx_leave_user (user_id),
            INDEX idx_leave_workspace (workspace_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    EnsureTable("user_status_logs", @"
        CREATE TABLE user_status_logs (
            Id BIGINT AUTO_INCREMENT PRIMARY KEY,
            workspace_id BIGINT NOT NULL,
            user_id BIGINT NOT NULL,
            previous_status VARCHAR(20) NOT NULL,
            new_status VARCHAR(20) NOT NULL,
            status_source VARCHAR(20) NOT NULL DEFAULT 'SYSTEM',
            reason VARCHAR(255) NULL,
            changed_by_id BIGINT NULL,
            started_at_utc DATETIME NULL,
            expires_at_utc DATETIME NULL,
            created_at_utc DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_statuslog_user (user_id),
            INDEX idx_statuslog_workspace (workspace_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    EnsureTable("bulk_assignment_jobs", @"
        CREATE TABLE bulk_assignment_jobs (
            Id BIGINT AUTO_INCREMENT PRIMARY KEY,
            workspace_id BIGINT NOT NULL,
            created_by_admin_id BIGINT NOT NULL,
            assignment_method VARCHAR(20) NOT NULL DEFAULT 'AUTO',
            target_user_id BIGINT NULL,
            lead_ids_json LONGTEXT NOT NULL,
            scheduled_at_utc DATETIME NULL,
            started_at_utc DATETIME NULL,
            completed_at_utc DATETIME NULL,
            status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
            total_lead_count INT NOT NULL DEFAULT 0,
            assigned_count INT NOT NULL DEFAULT 0,
            unassigned_count INT NOT NULL DEFAULT 0,
            failure_summary TEXT NULL,
            created_at_utc DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_bulk_workspace (workspace_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    EnsureTable("meta_tokens", @"
        CREATE TABLE meta_tokens (
            Id BIGINT AUTO_INCREMENT PRIMARY KEY,
            token_type VARCHAR(50) NOT NULL UNIQUE,
            access_token TEXT NOT NULL,
            expires_at DATETIME NULL,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_meta_tokens_type (token_type)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    EnsureTable("api_keys", @"
        CREATE TABLE api_keys (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            workspace_id BIGINT NOT NULL,
            name VARCHAR(100) NOT NULL,
            key_prefix VARCHAR(20) NOT NULL,
            key_hash VARCHAR(255) NOT NULL,
            scope VARCHAR(50) NOT NULL DEFAULT 'Full-Access',
            created_by_id BIGINT NULL,
            created_by_name VARCHAR(100) NULL,
            last_used_at DATETIME NULL,
            expires_at DATETIME NULL,
            is_revoked TINYINT(1) NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_api_keys_workspace (workspace_id),
            INDEX idx_api_keys_prefix (key_prefix)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    // Ensure columns on bulk_assignment_jobs if table already existed previously
    EnsureColumn("bulk_assignment_jobs", "total_lead_count", "INT NOT NULL DEFAULT 0");
    EnsureColumn("bulk_assignment_jobs", "assigned_count", "INT NOT NULL DEFAULT 0");
    EnsureColumn("bulk_assignment_jobs", "unassigned_count", "INT NOT NULL DEFAULT 0");
    EnsureColumn("bulk_assignment_jobs", "failure_summary", "TEXT NULL");

    // 3. Database Indexes for High Performance Query Execution & Dashboard Speeds
    EnsureIndex("leads", "idx_leads_ws", "`workspace_id`");
    EnsureIndex("leads", "idx_leads_ws_created", "`workspace_id`, `created_at`");
    EnsureIndex("leads", "idx_leads_ws_status", "`workspace_id`, `Status`");
    EnsureIndex("leads", "idx_leads_ws_assigned", "`workspace_id`, `assigned_to_id`");
    EnsureIndex("leads", "idx_leads_assigned_created", "`assigned_to_id`, `created_at`");
    EnsureIndex("leads", "idx_leads_campaign", "`campaign_id`");
    EnsureIndex("leads", "idx_leads_phone", "`Phone`");
    EnsureIndex("leads", "idx_leads_email", "`Email`");

    EnsureIndex("campaigns", "idx_campaigns_ws_status", "`workspace_id`, `Status`");
    EnsureIndex("campaigns", "idx_campaigns_ws_created", "`workspace_id`, `created_at`");
    EnsureIndex("campaigns", "idx_camp_provider_ext", "`workspace_id`, `platform`, `ad_account_id`, `external_campaign_id`");

    EnsureIndex("sales_activities", "idx_sales_act_lead", "`lead_id`");
    EnsureIndex("sales_activities", "idx_sales_act_lead_key", "`lead_id`, `activity_key`");

    EnsureIndex("sales_activity_logs", "idx_sales_log_lead_created", "`lead_id`, `created_at`");
    EnsureIndex("sales_activity_logs", "idx_sales_log_activity", "`sales_activity_id`");

    EnsureIndex("followup_reminders", "idx_followup_lead", "`lead_id`");
    EnsureIndex("followup_reminders", "idx_followup_ws_sched", "`workspace_id`, `scheduled_at`");
    EnsureIndex("followup_reminders", "idx_followup_ws_status", "`workspace_id`, `Status`");
    EnsureIndex("followup_reminders", "idx_followup_assigned_status", "`assigned_to_id`, `Status`");

    EnsureIndex("tasks", "idx_tasks_ws_status", "`workspace_id`, `Status`");
    EnsureIndex("tasks", "idx_tasks_ws_assigned", "`workspace_id`, `assigned_to_id`");
    EnsureIndex("tasks", "idx_tasks_ws_created", "`workspace_id`, `created_at`");

    EnsureIndex("calendar_events", "idx_events_ws_start", "`workspace_id`, `start_time`");
    EnsureIndex("calendar_events", "idx_events_user_start", "`assigned_user_id`, `start_time`");

    EnsureIndex("activity_logs", "idx_actlogs_ws_created", "`workspace_id`, `created_at`");
    EnsureIndex("audit_logs", "idx_auditlogs_ws_time", "`workspace_id`, `created_at`");
    EnsureIndex("users", "idx_users_ws_status", "`workspace_id`, `Status`");
}
catch (Exception ex)
{
    Console.WriteLine($"[Database Schema Init]: {ex.Message}");
}

app.Run();
