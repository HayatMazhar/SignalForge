using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SignalForge.Application.DTOs;
using SignalForge.Application.Interfaces;
using SignalForge.Domain.Enums;

namespace SignalForge.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MarketController : ControllerBase
{
    private readonly IMarketDataService _marketData;
    private readonly IOptionsFlowService _optionsFlow;
    private readonly ICacheService _cache;
    private readonly ILogger<MarketController> _logger;

    private static readonly Dictionary<string, string> IndexNames = new()
    {
        ["SPY"] = "S&P 500",
        ["QQQ"] = "NASDAQ",
        ["DIA"] = "DOW",
        ["VIXY"] = "VIX"
    };

    private static readonly Dictionary<string, string[]> SectorStocks = new()
    {
        ["Technology"] = ["AAPL", "MSFT", "NVDA", "GOOGL", "META"],
        ["Healthcare"] = ["JNJ", "UNH", "LLY", "PFE", "MRK"],
        ["Financial"] = ["JPM", "BAC", "GS", "V", "MA"],
        ["Energy"] = ["XOM", "CVX", "COP"],
        ["Consumer"] = ["AMZN", "TSLA", "WMT", "COST", "HD"],
        ["Industrial"] = ["BA", "CAT", "GE"],
        ["Communication"] = ["DIS", "NFLX", "CMCSA", "VZ"]
    };

    private static readonly string[] HeatmapSymbols =
        ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "TSLA", "META", "JPM", "V", "JNJ",
         "WMT", "PG", "UNH", "HD", "DIS", "NFLX", "AMD", "CRM", "XOM", "BA"];

    private static readonly Dictionary<string, long> ApproxMarketCaps = new()
    {
        ["AAPL"] = 3_000_000_000_000,
        ["MSFT"] = 2_800_000_000_000,
        ["GOOGL"] = 1_900_000_000_000,
        ["AMZN"] = 1_800_000_000_000,
        ["NVDA"] = 2_500_000_000_000,
        ["TSLA"] = 800_000_000_000,
        ["META"] = 1_200_000_000_000,
        ["JPM"] = 550_000_000_000,
        ["V"] = 520_000_000_000,
        ["JNJ"] = 400_000_000_000,
        ["WMT"] = 450_000_000_000,
        ["PG"] = 380_000_000_000,
        ["UNH"] = 480_000_000_000,
        ["HD"] = 350_000_000_000,
        ["DIS"] = 200_000_000_000,
        ["NFLX"] = 250_000_000_000,
        ["AMD"] = 220_000_000_000,
        ["CRM"] = 240_000_000_000,
        ["XOM"] = 450_000_000_000,
        ["BA"] = 130_000_000_000
    };

    public MarketController(
        IMarketDataService marketData,
        IOptionsFlowService optionsFlow,
        ICacheService cache,
        ILogger<MarketController> logger)
    {
        _marketData = marketData;
        _optionsFlow = optionsFlow;
        _cache = cache;
        _logger = logger;
    }

    [HttpGet("indices")]
    public async Task<IActionResult> GetIndices(CancellationToken ct)
    {
        try
        {
            var tasks = IndexNames.Select(async kvp =>
            {
                try
                {
                    var quote = await _marketData.GetQuote(kvp.Key, ct);
                    if (quote is null) return null;

                    return new
                    {
                        name = kvp.Value,
                        symbol = kvp.Key,
                        value = quote.Price.ToString("N2"),
                        change = quote.ChangePercent,
                        up = quote.ChangePercent >= 0
                    };
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to fetch index quote for {Symbol}", kvp.Key);
                    return null;
                }
            });

            var results = await Task.WhenAll(tasks);
            return Ok(results.Where(r => r is not null));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fetch market indices");
            return StatusCode(500, new { error = "Failed to fetch market indices" });
        }
    }

    [HttpGet("breadth")]
    public async Task<IActionResult> GetBreadth(CancellationToken ct)
    {
        try
        {
            var moversTask = _marketData.GetTopMovers(ct);
            var flowTask = _optionsFlow.GetUnusualFlow(ct);

            await Task.WhenAll(moversTask, flowTask);

            var movers = moversTask.Result;
            var flow = flowTask.Result;

            int advancing = movers.Count(m => m.ChangePercent > 0);
            int declining = movers.Count(m => m.ChangePercent <= 0);
            int newHighs = movers.Count(m => m.ChangePercent > 3);
            int newLows = movers.Count(m => m.ChangePercent < -3);

            int calls = flow.Count(f => f.Type == OptionType.Call);
            int puts = flow.Count(f => f.Type == OptionType.Put);
            decimal putCall = calls > 0 ? Math.Round((decimal)puts / calls, 2) : 0;

            var top10 = movers.Take(10).ToList();
            var technicalTasks = top10.Select(async m =>
            {
                try
                {
                    return await _marketData.GetTechnicalIndicators(m.Symbol, ct);
                }
                catch
                {
                    return null;
                }
            });

            var technicals = await Task.WhenAll(technicalTasks);
            int bullishCount = technicals.Count(t => t is not null && t.Trend.Equals("Bullish", StringComparison.OrdinalIgnoreCase));
            decimal aboveSma200 = top10.Count > 0
                ? Math.Round((decimal)bullishCount / top10.Count * 100, 1)
                : 0;

            return Ok(new
            {
                advancing,
                declining,
                newHighs,
                newLows,
                aboveSMA200 = aboveSma200,
                putCall
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to compute market breadth");
            return StatusCode(500, new { error = "Failed to compute market breadth" });
        }
    }

    [HttpGet("sectors")]
    public async Task<IActionResult> GetSectors(CancellationToken ct)
    {
        try
        {
            const string cacheKey = "market:sectors";
            var cached = await _cache.GetAsync<object>(cacheKey, ct);
            if (cached is not null)
                return Ok(cached);

            var sectorTasks = SectorStocks.Select(async kvp =>
            {
                var representatives = kvp.Value.Take(3).ToArray();
                var quoteTasks = representatives.Select(async symbol =>
                {
                    try
                    {
                        return await _marketData.GetQuote(symbol, ct);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to fetch quote for {Symbol} in sector {Sector}", symbol, kvp.Key);
                        return null;
                    }
                });

                var quotes = (await Task.WhenAll(quoteTasks)).Where(q => q is not null).ToList();
                decimal avgChange = quotes.Count > 0
                    ? Math.Round(quotes.Average(q => q!.ChangePercent), 2)
                    : 0;

                return new
                {
                    name = kvp.Key,
                    changePercent = avgChange,
                    stocks = kvp.Value.Length,
                    representative = representatives
                };
            });

            var results = (await Task.WhenAll(sectorTasks)).ToList();

            await _cache.SetAsync(cacheKey, results, TimeSpan.FromMinutes(5), ct);

            return Ok(results);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to compute sector performance");
            return StatusCode(500, new { error = "Failed to compute sector performance" });
        }
    }

    [HttpGet("heatmap")]
    public async Task<IActionResult> GetHeatmap(CancellationToken ct)
    {
        try
        {
            var tasks = HeatmapSymbols.Select(async symbol =>
            {
                try
                {
                    var quote = await _marketData.GetQuote(symbol, ct);
                    if (quote is null) return null;

                    ApproxMarketCaps.TryGetValue(symbol, out long marketCap);

                    return new
                    {
                        symbol,
                        changePercent = quote.ChangePercent,
                        marketCap
                    };
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to fetch heatmap quote for {Symbol}", symbol);
                    return null;
                }
            });

            var results = await Task.WhenAll(tasks);
            return Ok(results.Where(r => r is not null));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate heatmap data");
            return StatusCode(500, new { error = "Failed to generate heatmap data" });
        }
    }

    [HttpGet("correlation")]
    public async Task<IActionResult> GetCorrelation(
        [FromQuery] string symbols = "AAPL,MSFT,GOOGL,NVDA,TSLA,META",
        CancellationToken ct = default)
    {
        try
        {
            var symbolList = symbols.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(s => s.ToUpperInvariant())
                .Distinct()
                .ToList();

            if (symbolList.Count < 2)
                return BadRequest(new { error = "At least 2 symbols are required" });

            var to = DateTime.UtcNow.Date;
            var from = to.AddDays(-90);

            var historyTasks = symbolList.Select(async symbol =>
            {
                var bars = await _marketData.GetHistory(symbol, from, to, ct);
                return (symbol, bars);
            });

            var histories = await Task.WhenAll(historyTasks);
            var closePrices = histories.ToDictionary(
                h => h.symbol,
                h => h.bars.OrderBy(b => b.Date).Select(b => b.Close).ToList());

            int n = symbolList.Count;
            var matrix = new decimal[n][];

            for (int i = 0; i < n; i++)
            {
                matrix[i] = new decimal[n];
                for (int j = 0; j < n; j++)
                {
                    if (i == j)
                    {
                        matrix[i][j] = 1m;
                    }
                    else if (j > i)
                    {
                        var x = closePrices[symbolList[i]];
                        var y = closePrices[symbolList[j]];
                        matrix[i][j] = CalculatePearsonCorrelation(x, y);
                    }
                    else
                    {
                        matrix[i][j] = matrix[j][i];
                    }
                }
            }

            return Ok(new
            {
                symbols = symbolList,
                matrix
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to compute correlation matrix");
            return StatusCode(500, new { error = "Failed to compute correlation matrix" });
        }
    }

    internal static decimal CalculatePearsonCorrelation(List<decimal> x, List<decimal> y)
    {
        int n = Math.Min(x.Count, y.Count);
        if (n < 2) return 0m;

        decimal sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;

        for (int i = 0; i < n; i++)
        {
            sumX += x[i];
            sumY += y[i];
            sumXY += x[i] * y[i];
            sumX2 += x[i] * x[i];
            sumY2 += y[i] * y[i];
        }

        decimal numerator = n * sumXY - sumX * sumY;
        decimal denominator = (decimal)Math.Sqrt(
            (double)(n * sumX2 - sumX * sumX) *
            (double)(n * sumY2 - sumY * sumY));

        if (denominator == 0) return 0m;

        return Math.Round(numerator / denominator, 4);
    }
}
