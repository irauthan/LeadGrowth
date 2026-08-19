using LeadGrowth.Data;
using LeadGrowth.Models;
using LeadGrowth.Services;
using Microsoft.EntityFrameworkCore;

namespace LeadGrowth.BackgroundServices;

public class CalendarReminderBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<CalendarReminderBackgroundService> _logger;

    public CalendarReminderBackgroundService(IServiceScopeFactory scopeFactory, ILogger<CalendarReminderBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await Task.Yield();
        _logger.LogInformation("CalendarReminderBackgroundService started.");

        // Wait 10 seconds initial delay to allow Web Host startup
        await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var dbContext = scope.ServiceProvider.GetRequiredService<LeadGrowthDbContext>();
                var wsManager = scope.ServiceProvider.GetRequiredService<IWebSocketManagerService>();

                await ScanAndSendCalendarRemindersAsync(dbContext, wsManager);
                await ScanAndMarkOverdueFollowupsAsync(dbContext, wsManager);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred in CalendarReminderBackgroundService");
            }

            // Run every 1 minute
            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
        }
    }

    private async Task ScanAndSendCalendarRemindersAsync(LeadGrowthDbContext dbContext, IWebSocketManagerService wsManager)
    {
        var now = DateTime.UtcNow;
        var upcomingLimit = now.AddHours(2);

        var upcomingEvents = await dbContext.CalendarEvents
            .Include(e => e.AssignedUser)
            .Where(e => !e.ReminderSent && e.StartTime <= upcomingLimit && e.Status != "CANCELLED")
            .ToListAsync();

        foreach (var calEvent in upcomingEvents)
        {
            int reminderMins = calEvent.ReminderMinutes;
            var reminderTime = calEvent.StartTime.AddMinutes(-reminderMins);

            if (now >= reminderTime)
            {
                var targetUserId = calEvent.AssignedUserId;
                if (targetUserId.HasValue)
                {
                    var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Id == targetUserId.Value);
                    if (user != null)
                    {
                        var title = $"Upcoming Event Reminder: {calEvent.Title}";
                        var message = $"Reminder: '{calEvent.Title}' ({calEvent.EventType}) is scheduled for {calEvent.StartTime:yyyy-MM-dd HH:mm}.";

                        var notification = new Notification
                        {
                            UserId = user.Id,
                            User = user,
                            Title = title,
                            Message = message,
                            IsRead = false,
                            CreatedAt = DateTime.UtcNow
                        };

                        dbContext.Notifications.Add(notification);
                        await dbContext.SaveChangesAsync();

                        await wsManager.BroadcastNotificationAsync(user.Id, notification);
                        _logger.LogInformation("Sent calendar reminder notification to user ID {UserId} for event ID {EventId}", user.Id, calEvent.Id);
                    }
                }

                calEvent.ReminderSent = true;
                await dbContext.SaveChangesAsync();
            }
        }
    }

    private async Task ScanAndMarkOverdueFollowupsAsync(LeadGrowthDbContext dbContext, IWebSocketManagerService wsManager)
    {
        var now = DateTime.UtcNow;
        var pendingFollowups = await dbContext.FollowupReminders
            .Include(f => f.Lead)
            .Include(f => f.AssignedTo)
            .Where(f => (f.Status == "UPCOMING" || f.Status == "PENDING") && f.ScheduledAt < now)
            .ToListAsync();

        foreach (var f in pendingFollowups)
        {
            f.Status = "OVERDUE";
            await dbContext.SaveChangesAsync();

            if (f.AssignedTo != null)
            {
                var leadName = f.Lead != null ? f.Lead.Name : "Lead";
                var notification = new Notification
                {
                    UserId = f.AssignedTo.Id,
                    User = f.AssignedTo,
                    Title = "Overdue Follow-up Alert",
                    Message = $"Follow-up for '{leadName}' was scheduled for {f.ScheduledAt:yyyy-MM-dd HH:mm} and is now OVERDUE.",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                };

                dbContext.Notifications.Add(notification);
                await dbContext.SaveChangesAsync();

                await wsManager.BroadcastNotificationAsync(f.AssignedTo.Id, notification);
                _logger.LogInformation("Marked follow-up ID {FollowupId} OVERDUE for lead {LeadName}", f.Id, leadName);
            }
        }
    }
}
