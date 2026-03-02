using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SignalForge.Application.Interfaces;

namespace SignalForge.Infrastructure.BackgroundServices;

public class PriceTickerService : BackgroundService
{
    private readonly IServiceProvider _services;
    private readonly ILogger<PriceTickerService> _logger;

    public PriceTickerService(IServiceProvider services, ILogger<PriceTickerService> logger)
    {
        _services = services;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Price Ticker Service started");

        while (!stoppingToken.IsCancellationRequested)
        {
            if (!IsMarketHours())
            {
                await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
                continue;
            }

            try
            {
                using var scope = _services.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
                var marketData = scope.ServiceProvider.GetRequiredService<IMarketDataService>();
                var hubContext = scope.ServiceProvider.GetRequiredService<IHubContext<MarketHub>>();

                var watchedSymbols = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions
                    .ToListAsync(
                        System.Linq.Queryable.Distinct(
                            System.Linq.Queryable.Select(db.UserWatchlists, w => w.Symbol)),
                        stoppingToken);

                foreach (var symbol in watchedSymbols)
                {
                    try
                    {
                        var quote = await marketData.GetQuote(symbol, stoppingToken);
                        if (quote is not null)
                        {
                            await hubContext.Clients.Group(symbol).SendAsync("PriceUpdate", quote, stoppingToken);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to get price for {Symbol}", symbol);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Price ticker cycle failed");
            }

            await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
        }
    }

    private static bool IsMarketHours()
    {
        try
        {
            var eastern = TimeZoneInfo.FindSystemTimeZoneById("Eastern Standard Time");
            var now = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, eastern);
            return now.DayOfWeek is >= DayOfWeek.Monday and <= DayOfWeek.Friday
                   && now.TimeOfDay >= new TimeSpan(9, 30, 0)
                   && now.TimeOfDay <= new TimeSpan(16, 0, 0);
        }
        catch (TimeZoneNotFoundException)
        {
            var eastern = TimeZoneInfo.FindSystemTimeZoneById("America/New_York");
            var now = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, eastern);
            return now.DayOfWeek is >= DayOfWeek.Monday and <= DayOfWeek.Friday
                   && now.TimeOfDay >= new TimeSpan(9, 30, 0)
                   && now.TimeOfDay <= new TimeSpan(16, 0, 0);
        }
    }
}

public class MarketHub : Hub
{
    public async Task SubscribeToStock(string symbol)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, symbol.ToUpperInvariant());
    }

    public async Task UnsubscribeFromStock(string symbol)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, symbol.ToUpperInvariant());
    }
}
