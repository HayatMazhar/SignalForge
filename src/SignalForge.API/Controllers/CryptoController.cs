using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SignalForge.Application.DTOs;
using SignalForge.Application.Interfaces;

namespace SignalForge.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CryptoController : ControllerBase
{
    private readonly ICryptoDataService _crypto;
    private readonly IAISignalService _ai;

    public CryptoController(ICryptoDataService crypto, IAISignalService ai)
    {
        _crypto = crypto;
        _ai = ai;
    }

    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] string q, CancellationToken ct)
        => Ok(await _crypto.SearchCrypto(q, ct));

    [HttpGet("{symbol}/quote")]
    public async Task<IActionResult> GetQuote(string symbol, CancellationToken ct)
    {
        var quote = await _crypto.GetQuote(symbol.ToUpperInvariant(), ct);
        return quote is null ? NotFound() : Ok(quote);
    }

    [HttpGet("{symbol}/history")]
    public async Task<IActionResult> GetHistory(string symbol, [FromQuery] DateTime from, [FromQuery] DateTime to, CancellationToken ct)
        => Ok(await _crypto.GetHistory(symbol.ToUpperInvariant(), from, to, ct));

    [HttpGet("top-movers")]
    public async Task<IActionResult> TopMovers(CancellationToken ct)
        => Ok(await _crypto.GetTopMovers(ct));

    [HttpGet("movers/losers")]
    public async Task<IActionResult> TopLosers(CancellationToken ct)
        => Ok(await _crypto.GetTopLosers(ct));

    [HttpGet("{symbol}/indicators")]
    public async Task<IActionResult> GetIndicators(string symbol, CancellationToken ct)
    {
        var indicators = await _crypto.GetTechnicalIndicators(symbol.ToUpperInvariant(), ct);
        return indicators is null ? NotFound() : Ok(indicators);
    }

    [HttpGet("{symbol}/analysis")]
    public async Task<IActionResult> GetAnalysis(string symbol, CancellationToken ct)
    {
        var sym = symbol.ToUpperInvariant();
        var quote = await _crypto.GetQuote(sym, ct);
        var tech = await _crypto.GetTechnicalIndicators(sym, ct);
        if (quote is null) return NotFound();

        var prompt = $"Analyze {sym} cryptocurrency. Price: ${quote.Price}, 24h change: {quote.ChangePercent}%, "
            + $"RSI: {tech?.Rsi ?? 50}, Trend: {tech?.Trend ?? "Neutral"}. "
            + "Give a concise 3-sentence analysis with actionable insight.";

        var analysis = await _ai.ChatAsync("You are a crypto analyst.", [("user", prompt)], ct);
        return Ok(new { symbol = sym, price = quote.Price, change = quote.ChangePercent, analysis, trend = tech?.Trend, rsi = tech?.Rsi, generatedAt = DateTime.UtcNow });
    }

    [HttpGet("predict/{symbol}")]
    public async Task<IActionResult> PredictPrice(string symbol, CancellationToken ct)
    {
        var sym = symbol.ToUpperInvariant();
        var quote = await _crypto.GetQuote(sym, ct);
        var tech = await _crypto.GetTechnicalIndicators(sym, ct);
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
                assetType = "crypto",
            });
        }
        catch
        {
            return Ok(new { symbol = sym, currentPrice = quote.Price, summary = aiJson, generatedAt = DateTime.UtcNow, aiPowered = true, assetType = "crypto" });
        }
    }

    [HttpGet("market-overview")]
    public async Task<IActionResult> MarketOverview(CancellationToken ct)
    {
        var movers = await _crypto.GetTopMovers(ct);
        var losers = await _crypto.GetTopLosers(ct);
        var btc = await _crypto.GetQuote("BTC", ct);
        var eth = await _crypto.GetQuote("ETH", ct);

        return Ok(new
        {
            btcPrice = btc?.Price ?? 0,
            btcChange = btc?.ChangePercent ?? 0,
            ethPrice = eth?.Price ?? 0,
            ethChange = eth?.ChangePercent ?? 0,
            topGainers = movers.Take(5),
            topLosers = losers.Take(5),
            totalCoins = movers.Count + losers.Count,
        });
    }

    [HttpGet("fear-greed")]
    public async Task<IActionResult> CryptoFearGreed(CancellationToken ct)
    {
        var btc = await _crypto.GetQuote("BTC", ct);
        var eth = await _crypto.GetQuote("ETH", ct);
        var movers = await _crypto.GetTopMovers(ct);
        var losers = await _crypto.GetTopLosers(ct);

        var btcChange = btc?.ChangePercent ?? 0;
        var ethChange = eth?.ChangePercent ?? 0;
        var avgChange = movers.Count > 0 ? movers.Average(m => m.ChangePercent) : 0;
        var gainCount = movers.Count;
        var loseCount = losers.Count;

        try
        {
            var prompt = $"Compute a Crypto Fear & Greed Index (0-100) based on:\n"
                + $"- BTC 24h: {btcChange:F2}%, ETH 24h: {ethChange:F2}%\n"
                + $"- {gainCount} gainers vs {loseCount} losers\n"
                + $"- Average change: {avgChange:F2}%\n\n"
                + "Return JSON: { \"score\": <0-100>, \"label\": \"Extreme Fear|Fear|Neutral|Greed|Extreme Greed\", "
                + "\"momentum\": <0-100>, \"breadth\": <0-100>, \"volatility\": <0-100>, \"dominance\": <0-100>, \"volume\": <0-100>, \"socialSentiment\": <0-100> }\n"
                + "Return ONLY JSON.";

            var aiJson = await _ai.ChatAsync("You are a crypto market analyst.", [("user", prompt)], ct);
            var parsed = JsonSerializer.Deserialize<JsonElement>(aiJson);

            return Ok(new
            {
                score = parsed.TryGetProperty("score", out var s) ? s.GetInt32() : 50,
                label = parsed.TryGetProperty("label", out var l) ? l.GetString() : "Neutral",
                momentum = parsed.TryGetProperty("momentum", out var m) ? m.GetInt32() : 50,
                breadth = parsed.TryGetProperty("breadth", out var b) ? b.GetInt32() : 50,
                putCallRatio = parsed.TryGetProperty("volume", out var v) ? v.GetInt32() : 50,
                volatility = parsed.TryGetProperty("volatility", out var vol) ? vol.GetInt32() : 50,
                safeHaven = parsed.TryGetProperty("dominance", out var d) ? d.GetInt32() : 50,
                junkBondDemand = parsed.TryGetProperty("socialSentiment", out var ss) ? ss.GetInt32() : 50,
                updatedAt = DateTime.UtcNow.ToString("o"),
                assetType = "crypto",
            });
        }
        catch
        {
            var score = (int)Math.Clamp(50 + btcChange * 3, 0, 100);
            var label = score >= 75 ? "Extreme Greed" : score >= 60 ? "Greed" : score >= 45 ? "Neutral" : score >= 25 ? "Fear" : "Extreme Fear";
            return Ok(new { score, label, momentum = 50, breadth = 50, putCallRatio = 50, volatility = 50, safeHaven = 50, junkBondDemand = 50, updatedAt = DateTime.UtcNow.ToString("o"), assetType = "crypto" });
        }
    }

    [HttpGet("signals")]
    public async Task<IActionResult> CryptoSignals(CancellationToken ct)
    {
        var symbols = new[] { "BTC", "ETH", "SOL", "XRP", "DOGE", "ADA", "AVAX", "DOT", "LINK", "MATIC" };
        var signals = new List<object>();

        foreach (var sym in symbols)
        {
            var tech = await _crypto.GetTechnicalIndicators(sym, ct);
            if (tech == null) continue;

            var techScore = Math.Clamp(50 + (tech.Rsi < 30 ? 20 : tech.Rsi > 70 ? -20 : 0) + (tech.Trend == "Bullish" ? 15 : tech.Trend == "Bearish" ? -15 : 0), 0, 100);
            var type = techScore >= 65 ? "Buy" : techScore <= 35 ? "Sell" : "Hold";

            signals.Add(new
            {
                id = Guid.NewGuid().ToString(),
                symbol = sym,
                type,
                confidenceScore = Math.Round((decimal)techScore, 1),
                reasoning = $"{sym} shows {tech.Trend.ToLower()} momentum with RSI at {tech.Rsi:F0}. MACD is {(tech.Macd > 0 ? "positive" : "negative")} suggesting {(tech.Macd > 0 ? "upward" : "downward")} pressure.",
                technicalScore = (int)tech.Rsi,
                sentimentScore = 50,
                optionsScore = 50,
                generatedAt = DateTime.UtcNow.ToString("o"),
                assetType = "crypto",
            });
        }

        return Ok(signals.OrderByDescending(s => ((dynamic)s).confidenceScore));
    }

    [HttpGet("news")]
    public async Task<IActionResult> CryptoNews(CancellationToken ct)
    {
        var newsSymbols = new[] { "BTC", "ETH", "SOL", "XRP", "DOGE" };
        var quotes = new List<(string Symbol, StockQuoteDto Quote)>();

        foreach (var sym in newsSymbols)
        {
            var q = await _crypto.GetQuote(sym, ct);
            if (q is not null)
                quotes.Add((sym, q));
        }

        if (quotes.Count == 0)
            return Ok(Array.Empty<object>());

        try
        {
            var priceLines = string.Join("\n", quotes.Select(q =>
                $"- {q.Symbol}: ${q.Quote.Price:F2}, 24h change: {q.Quote.ChangePercent:F2}%, volume: {q.Quote.Volume:N0}"));

            var prompt = $"Based on these REAL crypto prices right now:\n{priceLines}\n\n"
                + "Generate exactly 10 crypto news headlines with analysis. Return JSON array with objects: "
                + "{ \"title\": string, \"symbol\": string, \"summary\": string (1-2 sentences), \"source\": string (realistic outlet name), \"sentimentScore\": number (-1.0 to 1.0) }\n"
                + "Make headlines reflect the actual price movements shown. Return ONLY the JSON array.";

            var aiJson = await _ai.ChatAsync("You are a crypto news analyst.", [("user", prompt)], ct);
            var parsed = JsonSerializer.Deserialize<JsonElement>(aiJson);

            var news = new List<object>();
            var hourOffset = 0;
            foreach (var item in parsed.EnumerateArray())
            {
                news.Add(new
                {
                    id = Guid.NewGuid().ToString(),
                    title = item.GetProperty("title").GetString(),
                    symbol = item.GetProperty("symbol").GetString(),
                    summary = item.GetProperty("summary").GetString(),
                    source = item.GetProperty("source").GetString(),
                    sentimentScore = item.GetProperty("sentimentScore").GetDouble(),
                    publishedAt = DateTime.UtcNow.AddHours(-(++hourOffset)).ToString("o"),
                });
            }

            return Ok(news);
        }
        catch
        {
            var fallbackNews = quotes.SelectMany((q, i) =>
            {
                var direction = q.Quote.ChangePercent >= 0 ? "up" : "down";
                var sentiment = q.Quote.ChangePercent >= 0 ? "Bullish momentum continues" : "Bears maintain pressure";
                return new[]
                {
                    new
                    {
                        id = Guid.NewGuid().ToString(),
                        title = $"{q.Symbol} {direction} {Math.Abs(q.Quote.ChangePercent):F1}% to ${q.Quote.Price:F2} - {sentiment}",
                        symbol = q.Symbol,
                        summary = $"{q.Symbol} is trading at ${q.Quote.Price:F2} with a {q.Quote.ChangePercent:F2}% change in the last 24 hours on volume of {q.Quote.Volume:N0}.",
                        source = "SignalForge Analytics",
                        sentimentScore = (double)Math.Clamp(q.Quote.ChangePercent / 10m, -1m, 1m),
                        publishedAt = DateTime.UtcNow.AddHours(-(i + 1)).ToString("o"),
                    },
                    new
                    {
                        id = Guid.NewGuid().ToString(),
                        title = $"{q.Symbol} Volume {(q.Quote.Volume > 1_000_000_000 ? "Surges" : "Steady")} at {q.Quote.Volume:N0}",
                        symbol = q.Symbol,
                        summary = $"Trading volume for {q.Symbol} at {q.Quote.Volume:N0} as price sits at ${q.Quote.Price:F2}.",
                        source = "SignalForge Analytics",
                        sentimentScore = (double)Math.Clamp(q.Quote.ChangePercent / 15m, -1m, 1m),
                        publishedAt = DateTime.UtcNow.AddHours(-(i + 6)).ToString("o"),
                    },
                };
            }).Take(10).ToList();

            return Ok(fallbackNews);
        }
    }

    [HttpGet("market-pulse")]
    public async Task<IActionResult> CryptoMarketPulse(CancellationToken ct)
    {
        var movers = await _crypto.GetTopMovers(ct);
        var losers = await _crypto.GetTopLosers(ct);
        var events = new List<object>();

        foreach (var m in movers.Take(3))
        {
            events.Add(new { id = Guid.NewGuid().ToString(), type = "Signal", symbol = m.Symbol, title = $"{m.Symbol} Up {m.ChangePercent:F1}%", description = $"{m.Name} gained {m.ChangePercent:F1}% to ${m.Price:F2}", impact = "Bullish", timestamp = DateTime.UtcNow.AddMinutes(-10).ToString("o") });
        }
        foreach (var l in losers.Take(2))
        {
            events.Add(new { id = Guid.NewGuid().ToString(), type = "Alert", symbol = l.Symbol, title = $"{l.Symbol} Down {l.ChangePercent:F1}%", description = $"{l.Name} dropped {Math.Abs(l.ChangePercent):F1}% to ${l.Price:F2}", impact = "Bearish", timestamp = DateTime.UtcNow.AddMinutes(-20).ToString("o") });
        }

        var btcQ = await _crypto.GetQuote("BTC", ct);
        if (btcQ is not null)
        {
            var btcDir = btcQ.ChangePercent >= 0 ? "Bullish" : "Bearish";
            events.Add(new { id = Guid.NewGuid().ToString(), type = "Economic", symbol = "BTC",
                title = $"BTC at ${btcQ.Price:F0} ({(btcQ.ChangePercent >= 0 ? "+" : "")}{btcQ.ChangePercent:F1}%)",
                description = $"Bitcoin trading at ${btcQ.Price:F2} with {btcQ.ChangePercent:F2}% change on volume {btcQ.Volume:N0}",
                impact = btcDir, timestamp = DateTime.UtcNow.AddHours(-1).ToString("o") });
        }

        return Ok(events.OrderByDescending(e => ((dynamic)e).timestamp));
    }

    [HttpGet("smart-money")]
    public async Task<IActionResult> CryptoSmartMoney(CancellationToken ct)
    {
        var symbols = new[] { "BTC", "ETH", "SOL", "XRP", "DOGE", "ADA", "AVAX", "DOT", "LINK", "MATIC" };
        var quotes = new List<(string Symbol, StockQuoteDto Quote)>();

        foreach (var sym in symbols)
        {
            var q = await _crypto.GetQuote(sym, ct);
            if (q is not null)
                quotes.Add((sym, q));
        }

        if (quotes.Count == 0)
            return Ok(Array.Empty<object>());

        try
        {
            var priceLines = string.Join("\n", quotes.Select(q =>
                $"- {q.Symbol}: ${q.Quote.Price:F2}, 24h change: {q.Quote.ChangePercent:F2}%, volume: {q.Quote.Volume:N0}"));

            var prompt = $"Based on these REAL crypto prices and volumes:\n{priceLines}\n\n"
                + "Estimate smart money / whale flows for each coin. Return a JSON array with objects: "
                + "{ \"symbol\": string, \"institutionalBuy\": number, \"institutionalSell\": number, "
                + "\"retailBuy\": number, \"retailSell\": number, \"signal\": \"Strong Accumulation\"|\"Accumulation\"|\"Distribution\"|\"Strong Distribution\", "
                + "\"darkPoolPercent\": number (0-100) }\n"
                + "Base estimates on price movements: strong gains suggest accumulation, losses suggest distribution. "
                + "Scale flow values proportionally to volume. Return ONLY the JSON array.";

            var aiJson = await _ai.ChatAsync("You are a crypto whale-flow analyst.", [("user", prompt)], ct);
            var parsed = JsonSerializer.Deserialize<JsonElement>(aiJson);

            var flows = new List<object>();
            foreach (var item in parsed.EnumerateArray())
            {
                var instBuy = item.GetProperty("institutionalBuy").GetDecimal();
                var instSell = item.GetProperty("institutionalSell").GetDecimal();
                var retBuy = item.GetProperty("retailBuy").GetDecimal();
                var retSell = item.GetProperty("retailSell").GetDecimal();
                flows.Add(new
                {
                    symbol = item.GetProperty("symbol").GetString(),
                    institutionalBuy = instBuy,
                    institutionalSell = instSell,
                    retailBuy = retBuy,
                    retailSell = retSell,
                    netFlow = (instBuy - instSell) + (retBuy - retSell),
                    signal = item.GetProperty("signal").GetString(),
                    darkPoolPercent = item.GetProperty("darkPoolPercent").GetInt32(),
                });
            }

            return Ok(flows.OrderByDescending(f => ((dynamic)f).netFlow).ToList());
        }
        catch
        {
            var fallbackFlows = quotes.Select(q =>
            {
                var volumeScale = q.Quote.Volume / 1_000_000m;
                var changeFactor = q.Quote.ChangePercent / 100m;
                var instBuy = volumeScale * (0.4m + Math.Max(changeFactor, 0)) * 1_000_000m;
                var instSell = volumeScale * (0.4m - Math.Min(changeFactor, 0)) * 1_000_000m;
                var retBuy = volumeScale * (0.2m + Math.Max(changeFactor * 0.5m, 0)) * 1_000_000m;
                var retSell = volumeScale * (0.2m - Math.Min(changeFactor * 0.5m, 0)) * 1_000_000m;
                var netFlow = (instBuy - instSell) + (retBuy - retSell);
                var signal = netFlow > 50_000_000 ? "Strong Accumulation"
                    : netFlow > 0 ? "Accumulation"
                    : netFlow < -50_000_000 ? "Strong Distribution"
                    : "Distribution";

                return new { symbol = q.Symbol, institutionalBuy = instBuy, institutionalSell = instSell, retailBuy = retBuy, retailSell = retSell, netFlow, signal, darkPoolPercent = 0 };
            }).OrderByDescending(f => f.netFlow).ToList();

            return Ok(fallbackFlows);
        }
    }
}
