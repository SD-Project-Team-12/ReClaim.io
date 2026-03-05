using Microsoft.EntityFrameworkCore;
using ReClaim.Api.Entities;

namespace ReClaim.Api.Services
{
    // BackgroundService is a built-in ASP.NET Core class for running background loops
    public class AutoReleaseService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<AutoReleaseService> _logger;

        // We must inject the ScopeFactory because BackgroundServices run as Singletons,
        // but our AppDbContext is Scoped (created per HTTP request).
        public AutoReleaseService(IServiceScopeFactory scopeFactory, ILogger<AutoReleaseService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Auto-Release SLA Monitor Engine started.");

            // Loop continuously until the server is shut down
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    // 1. Create a temporary scope to get the database context
                    using var scope = _scopeFactory.CreateScope();
                    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                    // 2. Find all Assigned (Status = 1) requests where 24 hours have passed 
                    // since the PreferredPickUpTime
                    var expiredRequests = await dbContext.PickUpRequests
                        .Where(r => r.Status == RequestStatus.Assigned 
                                 && r.PreferredPickUpTime.AddDays(1) < DateTime.UtcNow)
                        .ToListAsync(stoppingToken);

                    if (expiredRequests.Any())
                    {
                        // 3. Strip the driver and reset to Pending (Status = 0)
                        foreach (var req in expiredRequests)
                        {
                            req.Status = RequestStatus.Pending;
                            req.RecyclerId = null; // Unassign the driver
                            
                            _logger.LogWarning($"SLA BREACH: Request {req.Id} auto-released back to dispatch.");
                        }

                        await dbContext.SaveChangesAsync(stoppingToken);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError($"Error in Auto-Release Engine: {ex.Message}");
                }

                // 4. Wait for a specific time before checking again (e.g., check every 5 minutes)
                // In production, checking every 10-15 minutes is usually optimal to save DB load.
                await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
            }
        }
    }
}