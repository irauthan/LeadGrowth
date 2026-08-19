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

        // Wait 15 seconds initial delay to allow Web Host startup
        await Task.Delay(TimeSpan.FromSeconds(15), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var dbContext = scope.ServiceProvider.GetRequiredService<LeadGrowthDbContext>();
                var taskService = scope.ServiceProvider.GetRequiredService<ITaskService>();

                _logger.LogDebug("Sweep: Checking for tasks blocked by OFFLINE or ON_LEAVE users...");
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

            // Run every 1 minute
            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
        }
    }
}
