using LeadGrowth.Data;
using LeadGrowth.Services;
using Microsoft.EntityFrameworkCore;

namespace LeadGrowth.BackgroundServices;

public class AutoReassignmentBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<AutoReassignmentBackgroundService> _logger;

    public AutoReassignmentBackgroundService(IServiceScopeFactory scopeFactory, ILogger<AutoReassignmentBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await Task.Yield();
        _logger.LogInformation("AutoReassignmentBackgroundService started.");

        try
        {
            // Wait 15 seconds initial delay to allow Web Host startup
            await Task.Delay(TimeSpan.FromSeconds(15), stoppingToken);
        }
        catch (OperationCanceledException)
        {
            return;
        }

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var dbContext = scope.ServiceProvider.GetRequiredService<LeadGrowthDbContext>();
                var presenceService = scope.ServiceProvider.GetRequiredService<IUserPresenceService>();
                var bulkService = scope.ServiceProvider.GetRequiredService<IBulkAssignmentService>();
                var taskService = scope.ServiceProvider.GetRequiredService<ITaskService>();

                // 1. Reconcile expired manual Busy and Break statuses
                await presenceService.ReconcileExpiredStatusesAsync(stoppingToken);

                // 2. Process due Admin-scheduled Bulk Auto-Assign jobs
                await bulkService.ProcessDueScheduledJobsAsync(stoppingToken);

                // 3. Sweep for tasks blocked by offline/on_leave users
                var users = await dbContext.Users.ToListAsync(stoppingToken);
                foreach (var u in users)
                {
                    if (string.Equals("SUSPENDED", u.Status, StringComparison.OrdinalIgnoreCase)) continue;

                    var avail = u.AvailabilityStatus;
                    if (string.Equals("OFFLINE", avail, StringComparison.OrdinalIgnoreCase) || string.Equals("ON_LEAVE", avail, StringComparison.OrdinalIgnoreCase))
                    {
                        if (u.LastActiveAt == null || u.LastActiveAt.Value < DateTime.UtcNow.AddMinutes(-5))
                        {
                            try
                            {
                                await taskService.HandleUserOfflineAsync(u.Id);
                            }
                            catch (Exception ex)
                            {
                                _logger.LogError(ex, "Failed to sweep/reassign tasks for user ID: {UserId}", u.Id);
                            }
                        }
                    }
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred in AutoReassignmentBackgroundService");
            }

            try
            {
                // Run reconciliation every 1 minute
                await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }
    }
}
