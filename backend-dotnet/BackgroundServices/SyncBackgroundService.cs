using LeadGrowth.Data;
using LeadGrowth.Services;
using Microsoft.EntityFrameworkCore;

namespace LeadGrowth.BackgroundServices;

public class SyncBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<SyncBackgroundService> _logger;

    public SyncBackgroundService(IServiceScopeFactory scopeFactory, ILogger<SyncBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await Task.Yield();
        _logger.LogInformation("SyncBackgroundService started.");

        try
        {
            // Wait 1 minute initial delay to allow Web Host startup
            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
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
                var syncService = scope.ServiceProvider.GetRequiredService<ISyncService>();

                _logger.LogInformation("Starting hourly automated data sync for Meta & Google Ads...");
                var workspaces = await dbContext.Workspaces.ToListAsync(stoppingToken);

                foreach (var workspace in workspaces)
                {
                    try
                    {
                        await syncService.SyncWorkspaceAsync(workspace.Id, "Meta");
                        await syncService.SyncWorkspaceAsync(workspace.Id, "Google");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to sync workspace ID: {WorkspaceId}", workspace.Id);
                    }
                }

                _logger.LogInformation("Hourly automated data sync completed.");
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred in SyncBackgroundService");
            }

            try
            {
                // Wait 1 hour between runs
                await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }
    }
}
