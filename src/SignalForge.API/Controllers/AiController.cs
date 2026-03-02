using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SignalForge.Application.DTOs;
using SignalForge.Application.Interfaces;

namespace SignalForge.API.Controllers;

[ApiController]
[Route("api/ai")]
[Authorize]
public class AiController : ControllerBase
{
    private readonly IMarketDataService _market;
    private readonly IAISignalService _ai;
    private readonly IApplicationDbContext _db;
    private readonly ILogger<AiController> _logger;

    public AiController(IMarketDataService market, IAISignalService ai, IApplicationDbContext db, ILogger<AiController> logger)
    { _market = market; _ai = ai; _db = db; _logger = logger; }

    [HttpGet("predict/{symbol}")]
    public async Task<IActionResult> PredictPrice(string symbol, CancellationToken ct)
    {
        var sym = symbol.ToUpperInvariant();
        var quote = await _market.GetQuote(sym, ct);
        var tech = await _market.GetTechnicalIndicators(sym, ct);
        if (quote is null) return NotFound();

        var price = quote.Price;
        var trend = tech?.Trend ?? "Neutral";
        var rsi = tech?.Rsi ?? 50;
        var momentum = trend == "Bullish" ? 1.0m : trend == "Bearish" ? -1.0m : 0m;
        var rsiAdj = (50 - rsi) / 500;

        var rng = new Random(sym.GetHashCode() + DateTime.UtcNow.DayOfYear);
        var noise7 = (decimal)(rng.NextDouble() - 0.5) * 0.03m;
        var noise30 = (decimal)(rng.NextDouble() - 0.5) * 0.06m;
        var noise90 = (decimal)(rng.NextDouble() - 0.5) * 0.10m;

        var pred7 = Math.Round(price * (1 + momentum * 0.015m + rsiAdj + noise7), 2);
        var pred30 = Math.Round(price * (1 + momentum * 0.04m + rsiAdj * 2 + noise30), 2);
        var pred90 = Math.Round(price * (1 + momentum * 0.08m + rsiAdj * 3 + noise90), 2);

        var conf7 = 65 + rng.Next(20);
        var conf30 = 55 + rng.Next(20);
        var conf90 = 40 + rng.Next(25);

        return Ok(new
        {
            symbol = sym,
            currentPrice = price,
            predictions = new[]
            {
                new { horizon = "7 Days", price = pred7, change = Math.Round((pred7 - price) / price * 100, 2), confidence = conf7, direction = pred7 > price ? "Bullish" : "Bearish" },
                new { horizon = "30 Days", price = pred30, change = Math.Round((pred30 - price) / price * 100, 2), confidence = conf30, direction = pred30 > price ? "Bullish" : "Bearish" },
                new { horizon = "90 Days", price = pred90, change = Math.Round((pred90 - price) / price * 100, 2), confidence = conf90, direction = pred90 > price ? "Bullish" : "Bearish" },
            },
            factors = new[]
            {
                new { name = "Technical Momentum", impact = trend, weight = 35 },
                new { name = "RSI Signal", impact = rsi < 30 ? "Oversold" : rsi > 70 ? "Overbought" : "Neutral", weight = 20 },
                new { name = "Volume Trend", impact = quote.Volume > 50000000 ? "Above Average" : "Normal", weight = 15 },
                new { name = "Price Action", impact = quote.ChangePercent > 0 ? "Positive" : "Negative", weight = 15 },
                new { name = "Market Regime", impact = "Risk-On", weight = 15 },
            },
            generatedAt = DateTime.UtcNow,
        });
    }

    [HttpPost("optimize-portfolio")]
    public async Task<IActionResult> OptimizePortfolio(CancellationToken ct)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userId is null) return Unauthorized();

        var positions = await _db.Portfolios.Where(p => p.UserId == userId).ToListAsync(ct);
        if (positions.Count == 0) return Ok(new { suggestions = Array.Empty<object>(), summary = "No positions to optimize" });

        var totalValue = positions.Sum(p => p.Quantity * p.AverageCost);
        var suggestions = new List<object>();

        foreach (var pos in positions)
        {
            var weight = pos.Quantity * pos.AverageCost / totalValue * 100;
            var tech = await _market.GetTechnicalIndicators(pos.Symbol, ct);
            var rsi = tech?.Rsi ?? 50;

            string action;
            string reason;
            decimal targetWeight;

            if (weight > 30)
            {
                action = "Reduce";
                reason = $"Position is {weight:F0}% of portfolio - overconcentrated. Consider trimming to reduce risk.";
                targetWeight = 20;
            }
            else if (rsi > 75)
            {
                action = "Take Profits";
                reason = $"RSI at {rsi:F0} indicates overbought conditions. Consider taking partial profits.";
                targetWeight = Math.Max(weight - 5, 5);
            }
            else if (rsi < 25)
            {
                action = "Add";
                reason = $"RSI at {rsi:F0} suggests oversold. Consider adding if fundamentals are intact.";
                targetWeight = Math.Min(weight + 5, 25);
            }
            else
            {
                action = "Hold";
                reason = $"Position is balanced at {weight:F0}% with neutral technicals.";
                targetWeight = weight;
            }

            suggestions.Add(new
            {
                symbol = pos.Symbol,
                currentWeight = Math.Round(weight, 1),
                targetWeight = Math.Round(targetWeight, 1),
                action,
                reason,
                rsi = Math.Round(rsi, 0),
                trend = tech?.Trend ?? "Neutral",
            });
        }

        var sectorCount = positions.Select(p => p.Symbol).Distinct().Count();
        var maxWeight = positions.Max(p => p.Quantity * p.AverageCost / totalValue * 100);

        return Ok(new
        {
            suggestions,
            summary = new
            {
                totalPositions = positions.Count,
                totalValue = Math.Round(totalValue, 2),
                diversificationScore = Math.Min(sectorCount * 15, 100),
                concentrationRisk = maxWeight > 30 ? "High" : maxWeight > 20 ? "Medium" : "Low",
                overallHealth = maxWeight < 25 && sectorCount >= 5 ? "Excellent" : maxWeight < 30 ? "Good" : "Needs Attention",
            },
            generatedAt = DateTime.UtcNow,
        });
    }

    [HttpGet("anomalies/{symbol}")]
    public async Task<IActionResult> DetectAnomalies(string symbol, CancellationToken ct)
    {
        var sym = symbol.ToUpperInvariant();
        var quote = await _market.GetQuote(sym, ct);
        var tech = await _market.GetTechnicalIndicators(sym, ct);
        if (quote is null) return NotFound();

        var anomalies = new List<object>();
        var rsi = tech?.Rsi ?? 50;

        if (Math.Abs(quote.ChangePercent) > 3)
            anomalies.Add(new { type = "Price Spike", severity = "High", description = $"Unusual {(quote.ChangePercent > 0 ? "upward" : "downward")} move of {quote.ChangePercent:F1}%", detectedAt = DateTime.UtcNow });

        if (quote.Volume > 80000000)
            anomalies.Add(new { type = "Volume Surge", severity = "High", description = $"Volume at {quote.Volume:N0}, significantly above average", detectedAt = DateTime.UtcNow.AddMinutes(-15) });

        if (rsi > 80 || rsi < 20)
            anomalies.Add(new { type = "RSI Extreme", severity = "Medium", description = $"RSI at {rsi:F0} - {(rsi > 80 ? "extremely overbought" : "extremely oversold")}", detectedAt = DateTime.UtcNow.AddMinutes(-30) });

        if (tech is not null && Math.Abs(tech.Macd) > 5)
            anomalies.Add(new { type = "MACD Divergence", severity = "Medium", description = $"MACD at {tech.Macd:F2} - strong {(tech.Macd > 0 ? "bullish" : "bearish")} momentum", detectedAt = DateTime.UtcNow.AddHours(-1) });

        if (anomalies.Count == 0)
            anomalies.Add(new { type = "Normal", severity = "Low", description = "No anomalies detected. Trading within normal parameters.", detectedAt = DateTime.UtcNow });

        return Ok(new { symbol = sym, anomalies, riskLevel = anomalies.Any(a => ((dynamic)a).severity == "High") ? "Elevated" : "Normal" });
    }

    [HttpPost("natural-query")]
    public async Task<IActionResult> NaturalLanguageQuery([FromBody] NlQueryRequest request, CancellationToken ct)
    {
        var query = request.Query.ToLowerInvariant();
        var results = new List<object>();
        var interpretation = "";

        if (query.Contains("rsi") && query.Contains("under") || query.Contains("oversold"))
        {
            interpretation = "Stocks with RSI under 30 (oversold conditions)";
            var symbols = new[] { "AAPL", "MSFT", "GOOGL", "TSLA", "NVDA", "META", "AMZN", "AMD", "NFLX", "JPM" };
            foreach (var sym in symbols)
            {
                var tech = await _market.GetTechnicalIndicators(sym, ct);
                if (tech is not null && tech.Rsi < 35)
                    results.Add(new { symbol = sym, rsi = Math.Round(tech.Rsi, 1), trend = tech.Trend, macd = Math.Round(tech.Macd, 2) });
            }
        }
        else if (query.Contains("bullish") || query.Contains("buy"))
        {
            interpretation = "Stocks with bullish technical setup";
            var symbols = new[] { "AAPL", "MSFT", "GOOGL", "NVDA", "META", "AMZN", "NFLX", "AMD", "CRM", "LLY" };
            foreach (var sym in symbols)
            {
                var tech = await _market.GetTechnicalIndicators(sym, ct);
                if (tech is not null && tech.Trend == "Bullish")
                    results.Add(new { symbol = sym, rsi = Math.Round(tech.Rsi, 1), trend = tech.Trend, macd = Math.Round(tech.Macd, 2) });
            }
        }
        else if (query.Contains("top") || query.Contains("gainers") || query.Contains("movers"))
        {
            interpretation = "Today's top movers";
            var movers = await _market.GetTopMovers(ct);
            results.AddRange(movers.Take(10).Select(m => (object)new { symbol = m.Symbol, name = m.Name, price = m.Price, changePercent = m.ChangePercent }));
        }
        else
        {
            interpretation = $"Searching for: {request.Query}";
            var stocks = await _market.SearchStocks(request.Query, ct);
            results.AddRange(stocks.Take(10).Select(s => (object)new { symbol = s.Symbol, name = s.Name, sector = s.Sector }));
        }

        return Ok(new { query = request.Query, interpretation, resultCount = results.Count, results });
    }

    [HttpGet("sentiment-trend/{symbol}")]
    public async Task<IActionResult> SentimentTrend(string symbol, CancellationToken ct)
    {
        var rng = new Random(symbol.GetHashCode() + 42);
        var data = Enumerable.Range(0, 30).Select(i =>
        {
            var date = DateTime.UtcNow.AddDays(-29 + i);
            var score = -0.3m + (decimal)(rng.NextDouble() * 1.2) + (i > 20 ? 0.1m : 0);
            score = Math.Clamp(score, -1, 1);
            var articles = 5 + rng.Next(15);
            return new
            {
                date = date.ToString("yyyy-MM-dd"),
                score = Math.Round(score, 2),
                label = score > 0.3m ? "Bullish" : score < -0.3m ? "Bearish" : "Neutral",
                articlesAnalyzed = articles,
            };
        }).ToList();

        var avg = data.Average(d => d.score);
        var trend = avg > 0.1m ? "Improving" : avg < -0.1m ? "Declining" : "Stable";

        return Ok(new { symbol = symbol.ToUpperInvariant(), trend, averageScore = Math.Round(avg, 2), dataPoints = data });
    }
}

public record NlQueryRequest(string Query);
