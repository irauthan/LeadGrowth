using System.Text.Json;
using System.Text.Json.Serialization;
using LeadGrowth.BackgroundServices;
using LeadGrowth.Data;
using LeadGrowth.Hubs;
using LeadGrowth.Security;
using LeadGrowth.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// 1. Connection String & Database Context (EF Core + Pomelo MySQL 8.x)
var connectionString = builder.Configuration.GetConnectionString("LeadGrowthDb") 
    ?? "Server=localhost;Port=3306;Database=leadgrowth;User=root;Password=12345;";

builder.Services.AddDbContext<LeadGrowthDbContext>(options =>
{
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString));
});

// 2. Security, Realtime & Application Services DI Registration
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
builder.Services.AddScoped<ISyncService, SyncService>();
builder.Services.AddScoped<IReportService, ReportService>();
builder.Services.AddScoped<IExportService, ExportService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddScoped<IUserAnalyticsService, UserAnalyticsService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IAuditService, AuditService>();
builder.Services.AddScoped<IExecutiveWorkMonitoringService, ExecutiveWorkMonitoringService>();

// 2.5 Background Schedulers
builder.Services.Configure<HostOptions>(options =>
{
    options.BackgroundServiceExceptionBehavior = BackgroundServiceExceptionBehavior.Ignore;
});

builder.Services.AddHostedService<SyncBackgroundService>();
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
    options.AddPolicy("RequireAdmin", policy => policy.RequireRole("ROLE_ADMIN"));
    options.AddPolicy("RequireManagerOrAdmin", policy => policy.RequireRole("ROLE_ADMIN", "ROLE_MANAGER"));
    options.AddPolicy("RequireUser", policy => policy.RequireRole("ROLE_ADMIN", "ROLE_MANAGER", "ROLE_USER"));
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

app.Run();
