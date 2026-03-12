using System.Text.Json;
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
    private readonly INewsService _news;
    private readonly ILogger<AiController> _logger;

    public AiController(IMarketDataService market, IAISignalService ai, IApplicationDbContext db, INewsService news, ILogger<AiController> logger)
    { _market = market; _ai = ai; _db = db; _news = news; _logger = logger; }

    [HttpGet("predict/{symbol}")]
    public async Task<IActionResult> PredictPrice(string symbol, CancellationToken ct)
    {
        var sym = symbol.ToUpperInvariant();
        var quote = await _market.GetQuote(sym, ct);
        var tech = await _market.GetTechnicalIndicators(sym, ct);
        if (quote is null) return NotFound();

        var technicals = tech ?? new TechnicalDataDto(50, 0, 0, 0, 0, 0, 0, 0, 0, "Neutral");

        var aiJson = await _ai.PredictPriceAsync(
            sym, quote.Price, technicals, quote.ChangePercent, quote.Volume, ct);

        try
        {
            var parsed = JsonSerializer.Deserialize<JsonElement>(aiJson);
            return Ok(new
            {
                symbol = sym,
                currentPrice = quote.Price,
                predictions = parsed.TryGetProperty("predictions", out var preds) ? preds : default,
                factors = parsed.TryGetProperty("factors", out var facts) ? facts : default,
                summary = parsed.TryGetProperty("summary", out var summary) ? summary.GetString() : null,
                generatedAt = DateTime.UtcNow,
                aiPowered = true,
            });
        }
        catch
        {
            return Ok(new { symbol = sym, currentPrice = quote.Price, summary = aiJson, generatedAt = DateTime.UtcNow, aiPowered = true });
        }
    }

    [HttpPost("optimize-portfolio")]
    public async Task<IActionResult> OptimizePortfolio(CancellationToken ct)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userId is null) return Unauthorized();

        var positions = await _db.Portfolios.Where(p => p.UserId == userId).ToListAsync(ct);
        if (positions.Count == 0)
            return Ok(new { suggestions = Array.Empty<object>(), summary = new { totalPositions = 0, totalValue = 0, diversificationScore = 0, concentrationRisk = "N/A", overallHealth = "No positions" } });

        var posData = new List<(string Symbol, decimal Quantity, decimal AvgCost, TechnicalDataDto? Tech)>();
        foreach (var pos in positions)
        {
            var tech = await _market.GetTechnicalIndicators(pos.Symbol, ct);
            posData.Add((pos.Symbol, pos.Quantity, pos.AverageCost, tech));
        }

        var aiJson = await _ai.OptimizePortfolioAsync(posData, ct);

        try
        {
            var parsed = JsonSerializer.Deserialize<JsonElement>(aiJson);
            return Ok(new
            {
                suggestions = parsed.TryGetProperty("suggestions", out var sugg) ? sugg : default,
                summary = parsed.TryGetProperty("summary", out var summ) ? summ : default,
                generatedAt = DateTime.UtcNow,
                aiPowered = true,
            });
        }
        catch
        {
            return Ok(new { raw = aiJson, generatedAt = DateTime.UtcNow, aiPowered = true });
        }
    }

    [HttpGet("anomalies/{symbol}")]
    public async Task<IActionResult> DetectAnomalies(string symbol, CancellationToken ct)
    {
        var sym = symbol.ToUpperInvariant();
        var quote = await _market.GetQuote(sym, ct);
        var tech = await _market.GetTechnicalIndicators(sym, ct);
        if (quote is null) return NotFound();

        var aiJson = await _ai.DetectAnomaliesAsync(
            sym, quote.Price, quote.ChangePercent, quote.Volume, tech, ct);

        try
        {
            var parsed = JsonSerializer.Deserialize<JsonElement>(aiJson);
            return Ok(new
            {
                symbol = sym,
                anomalies = parsed.TryGetProperty("anomalies", out var anom) ? anom : default,
                riskLevel = parsed.TryGetProperty("riskLevel", out var risk) ? risk.GetString() : "Normal",
                aiInsight = parsed.TryGetProperty("aiInsight", out var insight) ? insight.GetString() : null,
                generatedAt = DateTime.UtcNow,
                aiPowered = true,
            });
        }
        catch
        {
            return Ok(new { symbol = sym, raw = aiJson, generatedAt = DateTime.UtcNow, aiPowered = true });
        }
    }

    [HttpPost("natural-query")]
    public async Task<IActionResult> NaturalLanguageQuery([FromBody] NlQueryRequest request, CancellationToken ct)
    {
        var contextParts = new List<string>();

        var movers = await _market.GetTopMovers(ct);
        if (movers.Count > 0)
            contextParts.Add($"Top movers today: {string.Join(", ", movers.Take(5).Select(m => $"{m.Symbol} {(m.ChangePercent > 0 ? "+" : "")}{m.ChangePercent:F1}%"))}");

        var query = request.Query.ToLowerInvariant();
        var possibleSymbols = new[] { "AAPL", "MSFT", "GOOGL", "TSLA", "NVDA", "META", "AMZN", "AMD", "NFLX", "JPM" };
        var mentionedSymbol = possibleSymbols.FirstOrDefault(s => query.Contains(s.ToLowerInvariant()));

        if (mentionedSymbol != null)
        {
            var q = await _market.GetQuote(mentionedSymbol, ct);
            var t = await _market.GetTechnicalIndicators(mentionedSymbol, ct);
            if (q != null)
                contextParts.Add($"{mentionedSymbol}: Price ${q.Price}, Change {q.ChangePercent:F2}%, Volume {q.Volume:N0}");
            if (t != null)
                contextParts.Add($"{mentionedSymbol} Technicals: RSI {t.Rsi:F1}, MACD {t.Macd:F2}, Trend {t.Trend}");
        }

        var aiJson = await _ai.NaturalQueryAsync(request.Query, string.Join("\n", contextParts), ct);

        try
        {
            var parsed = JsonSerializer.Deserialize<JsonElement>(aiJson);
            return Ok(new
            {
                query = request.Query,
                interpretation = parsed.TryGetProperty("interpretation", out var interp) ? interp.GetString() : request.Query,
                answer = parsed.TryGetProperty("answer", out var ans) ? ans.GetString() : null,
                results = parsed.TryGetProperty("results", out var res) ? res : default,
                suggestedFollowUps = parsed.TryGetProperty("suggestedFollowUps", out var follow) ? follow : default,
                resultCount = parsed.TryGetProperty("results", out var rc) && rc.ValueKind == JsonValueKind.Array ? rc.GetArrayLength() : 0,
                aiPowered = true,
            });
        }
        catch
        {
            return Ok(new { query = request.Query, answer = aiJson, resultCount = 0, aiPowered = true });
        }
    }

    [HttpGet("sentiment-trend/{symbol}")]
    public async Task<IActionResult> SentimentTrend(string symbol, CancellationToken ct)
    {
        var sym = symbol.ToUpperInvariant();

        var newsItems = await _news.GetNews(sym, 20, ct);
        var headlines = newsItems.Select(n => n.Title).ToList();

        if (headlines.Count == 0)
            return Ok(new { symbol = sym, trend = "Insufficient Data", averageScore = 0, dataPoints = Array.Empty<object>() });

        var sentiment = await _ai.AnalyzeSentiment(headlines, ct);

        var batchSize = Math.Max(headlines.Count / 5, 2);
        var dataPoints = new List<object>();
        for (int i = 0; i < headlines.Count; i += batchSize)
        {
            var batch = headlines.Skip(i).Take(batchSize).ToList();
            if (batch.Count == 0) continue;

            var batchSentiment = await _ai.AnalyzeSentiment(batch, ct);
            var dateOffset = (int)((double)i / headlines.Count * 30);
            dataPoints.Add(new
            {
                date = DateTime.UtcNow.AddDays(-30 + dateOffset).ToString("yyyy-MM-dd"),
                score = batchSentiment.Score,
                label = batchSentiment.Label,
                articlesAnalyzed = batch.Count,
            });
        }

        if (dataPoints.Count == 0)
            dataPoints.Add(new { date = DateTime.UtcNow.ToString("yyyy-MM-dd"), score = sentiment.Score, label = sentiment.Label, articlesAnalyzed = headlines.Count });

        var avg = sentiment.Score;
        var trend = avg > 0.1m ? "Improving" : avg < -0.1m ? "Declining" : "Stable";

        return Ok(new
        {
            symbol = sym,
            trend,
            averageScore = Math.Round(avg, 2),
            overallLabel = sentiment.Label,
            dataPoints,
            totalArticles = headlines.Count,
            aiPowered = true,
        });
    }
}

public record NlQueryRequest(string Query);
