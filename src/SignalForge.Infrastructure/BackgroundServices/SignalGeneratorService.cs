using MediatR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SignalForge.Application.Commands.Signals;
using SignalForge.Application.Interfaces;

namespace SignalForge.Infrastructure.BackgroundServices;

public class SignalGeneratorService : BackgroundService
{
    private readonly IServiceProvider _services;
    private readonly ILogger<SignalGeneratorService> _logger;

    public SignalGeneratorService(IServiceProvider services, ILogger<SignalGeneratorService> logger)
    {
        _services = services;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Signal Generator Service started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _services.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
                var mediator = scope.ServiceProvider.GetRequiredService<IMediator>();

                var watchedSymbols = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions
                    .ToListAsync(
                        System.Linq.Queryable.Distinct(
                            System.Linq.Queryable.Select(db.UserWatchlists, w => w.Symbol)),
                        stoppingToken);

                foreach (var symbol in watchedSymbols)
                {
                    try
                    {
                        await mediator.Send(new GenerateSignalCommand(symbol), stoppingToken);
                        _logger.LogInformation("Generated signal for {Symbol}", symbol);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to generate signal for {Symbol}", symbol);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Signal generation cycle failed");
            }

            await Task.Delay(TimeSpan.FromMinutes(15), stoppingToken);
        }
    }
}
