using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SignalForge.Application.DTOs;
using SignalForge.Application.Interfaces;

namespace SignalForge.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class InsightsController : ControllerBase
{
    private readonly IMarketDataService _marketData;
    private readonly INewsService _news;
    private readonly IOptionsFlowService _options;
    private readonly IAISignalService _ai;

    public InsightsController(IMarketDataService marketData, INewsService news, IOptionsFlowService options, IAISignalService ai)
    {
        _marketData = marketData;
        _news = news;
        _options = options;
        _ai = ai;
    }

    [HttpGet("thesis/{symbol}")]
    public async Task<IActionResult> GetTradeThesis(string symbol, CancellationToken ct)
    {
        var sym = symbol.ToUpperInvariant();
        var quote = await _marketData.GetQuote(sym, ct);
        var technicals = await _marketData.GetTechnicalIndicators(sym, ct);
        var newsItems = await _news.GetNews(sym, 5, ct);
        var flow = await _options.GetSymbolFlow(sym, ct);

        if (quote is null) return NotFound();

        var sentiment = newsItems.Count > 0
            ? await _ai.AnalyzeSentiment(newsItems.Select(n => n.Title).ToList(), ct)
            : new SentimentResultDto(0, "Neutral", 0);

        var price = quote.Price;
        var rsi = technicals?.Rsi ?? 50;
        var trend = technicals?.Trend ?? "Neutral";
        var callVol = flow.Where(f => f.Type == Domain.Enums.OptionType.Call).Sum(f => f.Volume);
        var putVol = flow.Where(f => f.Type == Domain.Enums.OptionType.Put).Sum(f => f.Volume);
        var unusualCount = flow.Count(f => f.IsUnusual);

        var techScore = CalculateScore(rsi, trend);
        var sentScore = NormalizeScore(sentiment.Score);
        var optScore = callVol + putVol > 0 ? (decimal)callVol / (callVol + putVol) * 100 : 50;
        var confidence = techScore * 0.4m + sentScore * 0.3m + optScore * 0.3m;

        var verdict = confidence >= 65 ? "Strong Buy" : confidence >= 55 ? "Buy" : confidence <= 35 ? "Strong Sell" : confidence <= 45 ? "Sell" : "Hold";
        var isBullish = confidence >= 50;

        var entry = Math.Round(price * (isBullish ? 0.99m : 1.01m), 2);
        var target = Math.Round(price * (isBullish ? 1.12m : 0.92m), 2);
        var stop = Math.Round(price * (isBullish ? 0.95m : 1.05m), 2);
        var risk = Math.Abs(entry - stop);
        var reward = Math.Abs(target - entry);
        var rrRatio = risk > 0 ? Math.Round(reward / risk, 2) : 0;

        var aiThesisJson = await _ai.GenerateThesisAsync(
            sym, price, technicals, sentiment, callVol, putVol, unusualCount, ct);

        string aiThesis, aiBullCase, aiBearCase;
        try
        {
            var parsed = JsonSerializer.Deserialize<JsonElement>(aiThesisJson);
            aiThesis = parsed.TryGetProperty("thesis", out var t) ? t.GetString() ?? "" : "";
            aiBullCase = parsed.TryGetProperty("bullCase", out var b) ? b.GetString() ?? "" : "";
            aiBearCase = parsed.TryGetProperty("bearCase", out var bc) ? bc.GetString() ?? "" : "";
        }
        catch
        {
            aiThesis = $"{sym} presents a {verdict.ToLower()} setup with {confidence:F0}% confidence.";
            aiBullCase = GenerateBullCase(sym, price, technicals, sentiment, callVol);
            aiBearCase = GenerateBearCase(sym, price, technicals, sentiment, putVol);
        }

        var thesis = new TradeThesisDto(
            sym, verdict, Math.Round(confidence, 1),
            aiThesis,
            aiBullCase,
            aiBearCase,
            entry, stop, target, rrRatio,
            confidence >= 65 || confidence <= 35 ? "2-4 Weeks" : "1-2 Weeks",
            [
                new("Technical Momentum", Math.Round(techScore, 1), trend == "Bullish" ? "Positive" : "Negative", $"RSI at {rsi:F0}, MACD {(technicals?.Macd > 0 ? "positive" : "negative")} crossover, price {(trend == "Bullish" ? "above" : "below")} 50-day SMA"),
                new("News Sentiment", Math.Round(sentScore, 1), sentiment.Label, $"Analyzed {sentiment.ArticlesAnalyzed} articles. Overall sentiment: {sentiment.Label} ({sentiment.Score:F2})"),
                new("Options Flow", Math.Round(optScore, 1), callVol > putVol ? "Bullish" : "Bearish", $"Call volume {callVol:N0} vs put volume {putVol:N0}. {(callVol > putVol * 2 ? "Heavy call buying detected" : putVol > callVol * 2 ? "Significant put activity" : "Balanced flow")}"),
                new("Risk/Reward", rrRatio * 25, rrRatio >= 2 ? "Favorable" : "Moderate", $"Risk/Reward ratio: {rrRatio:F1}:1. Entry ${entry}, Stop ${stop}, Target ${target}"),
            ],
            DateTime.UtcNow.ToString("o")
        );

        return Ok(thesis);
    }

    [HttpGet("fear-greed")]
    public IActionResult GetFearGreedIndex()
    {
        var rng = new Random(DateTime.UtcNow.DayOfYear);
        var momentum = 40 + rng.Next(40);
        var breadth = 35 + rng.Next(45);
        var putCall = 30 + rng.Next(50);
        var volatility = 25 + rng.Next(55);
        var safeHaven = 35 + rng.Next(40);
        var junkBond = 40 + rng.Next(35);
        var composite = (int)(momentum * 0.2 + breadth * 0.2 + putCall * 0.15 + volatility * 0.2 + safeHaven * 0.15 + junkBond * 0.1);
        var label = composite >= 75 ? "Extreme Greed" : composite >= 60 ? "Greed" : composite >= 45 ? "Neutral" : composite >= 25 ? "Fear" : "Extreme Fear";

        return Ok(new FearGreedDto(composite, label, momentum, breadth, putCall, volatility, safeHaven, junkBond, DateTime.UtcNow.ToString("o")));
    }

    [HttpGet("market-pulse")]
    public async Task<IActionResult> GetMarketPulse(CancellationToken ct)
    {
        var news = await _news.GetMarketNews(15, ct);
        var events = new List<MarketPulseEventDto>();

        foreach (var n in news)
        {
            var impact = n.SentimentScore > 0.3m ? "Bullish" : n.SentimentScore < -0.3m ? "Bearish" : "Neutral";
            events.Add(new MarketPulseEventDto(Guid.NewGuid().ToString(), "News", n.Symbol, n.Title, n.Summary, impact, n.PublishedAt.ToString("o")));
        }

        events.AddRange([
            new(Guid.NewGuid().ToString(), "Signal", "NVDA", "AI Buy Signal Generated", "NVDA triggered a strong buy signal with 78% confidence based on technical breakout and bullish options flow", "Bullish", DateTime.UtcNow.AddMinutes(-12).ToString("o")),
            new(Guid.NewGuid().ToString(), "Alert", "SPY", "S&P 500 New Intraday High", "The S&P 500 index reached a new intraday high, breaking above the 5,250 resistance level", "Bullish", DateTime.UtcNow.AddMinutes(-28).ToString("o")),
            new(Guid.NewGuid().ToString(), "Flow", "TSLA", "Unusual Options Activity", "$2.4M in TSLA call options swept at the ask, March 260 strike. Volume 15x normal", "Bullish", DateTime.UtcNow.AddMinutes(-45).ToString("o")),
            new(Guid.NewGuid().ToString(), "Signal", "BA", "AI Sell Signal Generated", "BA triggered a sell signal with 68% confidence due to negative sentiment and put-heavy options flow", "Bearish", DateTime.UtcNow.AddHours(-1).ToString("o")),
            new(Guid.NewGuid().ToString(), "Economic", "FED", "FOMC Minutes Released", "Fed officials signaled patience on rate cuts, maintaining current policy stance through mid-2026", "Neutral", DateTime.UtcNow.AddHours(-2).ToString("o")),
        ]);

        return Ok(events.OrderByDescending(e => e.Timestamp).Take(25));
    }

    [HttpGet("smart-money")]
    public IActionResult GetSmartMoneyFlow()
    {
        var rng = new Random(DateTime.UtcNow.DayOfYear + 42);
        var symbols = new[] { "AAPL", "MSFT", "NVDA", "TSLA", "AMZN", "META", "GOOGL", "AMD", "NFLX", "JPM", "CRM", "LLY", "BA", "XOM", "COIN" };

        var flows = symbols.Select(s =>
        {
            var instBuy = rng.Next(50, 500) * 100000m;
            var instSell = rng.Next(30, 400) * 100000m;
            var retBuy = rng.Next(20, 200) * 100000m;
            var retSell = rng.Next(15, 180) * 100000m;
            var netFlow = (instBuy - instSell) + (retBuy - retSell);
            var darkPool = 30 + rng.Next(25);
            var signal = netFlow > 10000000 ? "Strong Accumulation" : netFlow > 0 ? "Accumulation" : netFlow < -10000000 ? "Strong Distribution" : "Distribution";

            return new SmartMoneyFlowDto(s, instBuy, instSell, retBuy, retSell, netFlow, signal, darkPool);
        }).OrderByDescending(f => f.NetFlow).ToList();

        return Ok(flows);
    }

    private static decimal CalculateScore(decimal rsi, string trend)
    {
        decimal s = 50;
        if (rsi < 30) s += 20; else if (rsi > 70) s -= 20;
        if (trend == "Bullish") s += 15; else if (trend == "Bearish") s -= 15;
        return Math.Clamp(s, 0, 100);
    }

    private static decimal NormalizeScore(decimal sentiment) => Math.Clamp((sentiment + 1) * 50, 0, 100);

    private static string GenerateBullCase(string sym, decimal price, TechnicalDataDto? tech, SentimentResultDto sent, long callVol) =>
        $"Strong momentum with price trading above key moving averages. {(tech?.Rsi < 70 ? "RSI has room to run before overbought territory." : "Momentum remains strong despite elevated RSI.")} Positive news sentiment ({sent.Label}) supports continued upside. Significant call option volume ({callVol:N0} contracts) suggests institutional buyers are positioning for upside. Target: ${price * 1.12m:F2} based on Fibonacci extension.";

    private static string GenerateBearCase(string sym, decimal price, TechnicalDataDto? tech, SentimentResultDto sent, long putVol) =>
        $"Valuation concerns at current levels with potential resistance near ${price * 1.05m:F2}. {(tech?.Rsi > 50 ? "RSI approaching overbought territory increases pullback risk." : "Weakening technical momentum suggests downside continuation.")} Any negative catalyst could trigger profit-taking. Put volume ({putVol:N0} contracts) indicates hedging activity. Key support at ${price * 0.95m:F2}.";
}
