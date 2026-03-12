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
                confidenceScore = Math.Round(techScore, 1),
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
        var cryptoNews = new List<object>
        {
            new { id = Guid.NewGuid().ToString(), title = "Bitcoin Surges Past Key Resistance Level", symbol = "BTC", summary = "Bitcoin breaks above significant resistance, with analysts eyeing the next target as institutional demand continues.", source = "CryptoInsights", sentimentScore = 0.7, publishedAt = DateTime.UtcNow.AddHours(-1).ToString("o") },
            new { id = Guid.NewGuid().ToString(), title = "Ethereum Layer 2 Adoption Hits Record High", symbol = "ETH", summary = "Ethereum L2 solutions see unprecedented transaction volumes, reducing gas fees and improving scalability.", source = "DeFi Daily", sentimentScore = 0.6, publishedAt = DateTime.UtcNow.AddHours(-2).ToString("o") },
            new { id = Guid.NewGuid().ToString(), title = "Solana DeFi TVL Grows 40% in Q1", symbol = "SOL", summary = "Solana's DeFi ecosystem continues rapid expansion with new protocols and increasing total value locked.", source = "BlockchainBeat", sentimentScore = 0.8, publishedAt = DateTime.UtcNow.AddHours(-3).ToString("o") },
            new { id = Guid.NewGuid().ToString(), title = "SEC Delays Decision on Spot Ethereum ETF", symbol = "ETH", summary = "The Securities and Exchange Commission extends review period for multiple spot Ethereum ETF applications.", source = "CoinDesk", sentimentScore = -0.2, publishedAt = DateTime.UtcNow.AddHours(-4).ToString("o") },
            new { id = Guid.NewGuid().ToString(), title = "XRP Sees Massive Whale Accumulation", symbol = "XRP", summary = "Large XRP holders increase positions significantly, suggesting confidence in upcoming price movement.", source = "Whale Alert", sentimentScore = 0.5, publishedAt = DateTime.UtcNow.AddHours(-5).ToString("o") },
            new { id = Guid.NewGuid().ToString(), title = "Dogecoin Community Proposes Major Network Upgrade", symbol = "DOGE", summary = "The Dogecoin development team outlines plans for a significant protocol upgrade to improve transaction speed.", source = "DogeDaily", sentimentScore = 0.4, publishedAt = DateTime.UtcNow.AddHours(-6).ToString("o") },
            new { id = Guid.NewGuid().ToString(), title = "Cardano Smart Contract Activity Surges", symbol = "ADA", summary = "Cardano blockchain sees record smart contract deployments as DeFi ecosystem gains momentum.", source = "CryptoWatch", sentimentScore = 0.6, publishedAt = DateTime.UtcNow.AddHours(-7).ToString("o") },
            new { id = Guid.NewGuid().ToString(), title = "Global Crypto Regulation Framework Takes Shape", symbol = "BTC", summary = "Major economies align on cryptocurrency regulation standards, bringing clarity for institutional investors.", source = "Reuters Crypto", sentimentScore = 0.3, publishedAt = DateTime.UtcNow.AddHours(-8).ToString("o") },
            new { id = Guid.NewGuid().ToString(), title = "Avalanche Subnet Technology Attracts Enterprise Interest", symbol = "AVAX", summary = "Major enterprises explore Avalanche subnets for private blockchain solutions and tokenization.", source = "Enterprise Crypto", sentimentScore = 0.5, publishedAt = DateTime.UtcNow.AddHours(-9).ToString("o") },
            new { id = Guid.NewGuid().ToString(), title = "DeFi Lending Protocols See $10B Inflow", symbol = "AAVE", summary = "Decentralized lending platforms attract significant capital as yields become competitive with traditional finance.", source = "DeFi Pulse", sentimentScore = 0.7, publishedAt = DateTime.UtcNow.AddHours(-10).ToString("o") },
        };
        return Ok(cryptoNews);
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

        events.Add(new { id = Guid.NewGuid().ToString(), type = "Economic", symbol = "BTC", title = "Bitcoin Dominance Shifts", description = "BTC dominance changes reflect broader crypto market rotation patterns", impact = "Neutral", timestamp = DateTime.UtcNow.AddHours(-1).ToString("o") });

        return Ok(events.OrderByDescending(e => ((dynamic)e).timestamp));
    }

    [HttpGet("smart-money")]
    public async Task<IActionResult> CryptoSmartMoney(CancellationToken ct)
    {
        var symbols = new[] { "BTC", "ETH", "SOL", "XRP", "DOGE", "ADA", "AVAX", "DOT", "LINK", "MATIC" };
        var rng = new Random(DateTime.UtcNow.DayOfYear + 100);

        var flows = symbols.Select(sym =>
        {
            var whaleBuy = rng.Next(10, 200) * 1000000m;
            var whaleSell = rng.Next(5, 150) * 1000000m;
            var retailBuy = rng.Next(5, 80) * 1000000m;
            var retailSell = rng.Next(3, 70) * 1000000m;
            var netFlow = (whaleBuy - whaleSell) + (retailBuy - retailSell);
            var signal = netFlow > 50000000 ? "Strong Accumulation" : netFlow > 0 ? "Accumulation" : netFlow < -50000000 ? "Strong Distribution" : "Distribution";
            return new { symbol = sym, institutionalBuy = whaleBuy, institutionalSell = whaleSell, retailBuy, retailSell, netFlow, signal, darkPoolPercent = 0 };
        }).OrderByDescending(f => f.netFlow).ToList();

        return Ok(flows);
    }
}
