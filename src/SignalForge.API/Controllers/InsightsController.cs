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
    public async Task<IActionResult> GetFearGreedIndex(CancellationToken ct)
    {
        var movers = await _marketData.GetTopMovers(ct);
        var gainers = movers.Count(m => m.ChangePercent > 0);
        var losers = movers.Count(m => m.ChangePercent < 0);
        var avgChange = movers.Count > 0 ? movers.Average(m => m.ChangePercent) : 0;
        var topGain = movers.Count > 0 ? movers.Max(m => m.ChangePercent) : 0;
        var topLoss = movers.Count > 0 ? movers.Min(m => m.ChangePercent) : 0;

        try
        {
            var prompt = "You are a market sentiment analyst. Based on the following market data, compute a Fear & Greed Index.\n\n"
                + $"Market Data:\n"
                + $"- Top movers: {gainers} gainers vs {losers} losers\n"
                + $"- Average change: {avgChange:F2}%\n"
                + $"- Biggest gain: {topGain:F2}%, Biggest loss: {topLoss:F2}%\n\n"
                + "Return a JSON object:\n"
                + "{\n"
                + "  \"score\": <0-100 composite score>,\n"
                + "  \"label\": \"Extreme Fear|Fear|Neutral|Greed|Extreme Greed\",\n"
                + "  \"momentum\": <0-100>,\n"
                + "  \"breadth\": <0-100>,\n"
                + "  \"putCallRatio\": <0-100>,\n"
                + "  \"volatility\": <0-100>,\n"
                + "  \"safeHaven\": <0-100>,\n"
                + "  \"junkBondDemand\": <0-100>\n"
                + "}\nReturn ONLY valid JSON.";

            var aiJson = await _ai.ChatAsync("You are a market data analyst.", [("user", prompt)], ct);
            var parsed = JsonSerializer.Deserialize<JsonElement>(aiJson);

            var score = parsed.TryGetProperty("score", out var s) ? s.GetInt32() : 50;
            var label = parsed.TryGetProperty("label", out var l) ? l.GetString() ?? "Neutral" : "Neutral";
            var momentum = parsed.TryGetProperty("momentum", out var m) ? m.GetInt32() : 50;
            var breadth = parsed.TryGetProperty("breadth", out var b) ? b.GetInt32() : 50;
            var putCall = parsed.TryGetProperty("putCallRatio", out var p) ? p.GetInt32() : 50;
            var volatility = parsed.TryGetProperty("volatility", out var v) ? v.GetInt32() : 50;
            var safeHaven = parsed.TryGetProperty("safeHaven", out var sh) ? sh.GetInt32() : 50;
            var junkBond = parsed.TryGetProperty("junkBondDemand", out var jb) ? jb.GetInt32() : 50;

            return Ok(new FearGreedDto(score, label, momentum, breadth, putCall, volatility, safeHaven, junkBond, DateTime.UtcNow.ToString("o")));
        }
        catch
        {
            var momentum = (int)Math.Clamp(50 + avgChange * 5, 0, 100);
            var breadthScore = gainers + losers > 0 ? (int)((double)gainers / (gainers + losers) * 100) : 50;
            var putCallScore = 50;
            var volatilityScore = (int)Math.Clamp(50 - Math.Abs(avgChange) * 3, 0, 100);
            var safeHavenScore = avgChange >= 0 ? 60 : 40;
            var junkBondScore = 50;
            var composite = (int)(momentum * 0.2 + breadthScore * 0.2 + putCallScore * 0.15 + volatilityScore * 0.2 + safeHavenScore * 0.15 + junkBondScore * 0.1);
            var label = composite >= 75 ? "Extreme Greed" : composite >= 60 ? "Greed" : composite >= 45 ? "Neutral" : composite >= 25 ? "Fear" : "Extreme Fear";
            return Ok(new FearGreedDto(composite, label, momentum, breadthScore, putCallScore, volatilityScore, safeHavenScore, junkBondScore, DateTime.UtcNow.ToString("o")));
        }
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

        try
        {
            var recentSignals = await _marketData.GetTopMovers(ct);
            foreach (var mover in recentSignals.Take(3))
            {
                var impact = mover.ChangePercent > 2 ? "Bullish" : mover.ChangePercent < -2 ? "Bearish" : "Neutral";
                var desc = $"{mover.Symbol} ({mover.Name}) moved {(mover.ChangePercent > 0 ? "+" : "")}{mover.ChangePercent:F1}% to ${mover.Price:F2}";
                events.Add(new MarketPulseEventDto(Guid.NewGuid().ToString(), "Signal", mover.Symbol, $"{mover.Symbol} Major Price Movement", desc, impact, DateTime.UtcNow.AddMinutes(-15).ToString("o")));
            }
        }
        catch { }

        if (events.Count < 5)
        {
            try
            {
                var extraMovers = await _marketData.GetTopMovers(ct);
                foreach (var m in extraMovers.Take(5 - events.Count))
                {
                    var impact = m.ChangePercent > 0 ? "Bullish" : "Bearish";
                    events.Add(new(Guid.NewGuid().ToString(), "Signal", m.Symbol,
                        $"{m.Symbol} {(m.ChangePercent > 0 ? "Gains" : "Drops")} {Math.Abs(m.ChangePercent):F1}%",
                        $"{m.Name} moved {(m.ChangePercent > 0 ? "+" : "")}{m.ChangePercent:F1}% to ${m.Price:F2}",
                        impact, DateTime.UtcNow.AddMinutes(-10 * (events.Count + 1)).ToString("o")));
                }
            }
            catch { }
        }

        return Ok(events.OrderByDescending(e => e.Timestamp).Take(25));
    }

    [HttpGet("smart-money")]
    public async Task<IActionResult> GetSmartMoneyFlow(CancellationToken ct)
    {
        var symbols = new[] { "AAPL", "MSFT", "NVDA", "TSLA", "AMZN", "META", "GOOGL", "AMD", "NFLX", "JPM", "CRM", "LLY", "BA", "XOM", "COIN" };

        try
        {
            var quoteData = new List<string>();
            foreach (var sym in symbols.Take(8))
            {
                var q = await _marketData.GetQuote(sym, ct);
                if (q != null)
                    quoteData.Add($"{sym}: ${q.Price:F2}, change {q.ChangePercent:F2}%, vol {q.Volume:N0}");
            }

            var optionsData = new List<string>();
            foreach (var sym in symbols.Take(8))
            {
                var flow = await _options.GetSymbolFlow(sym, ct);
                var calls = flow.Where(f => f.Type == Domain.Enums.OptionType.Call).Sum(f => f.Volume);
                var puts = flow.Where(f => f.Type == Domain.Enums.OptionType.Put).Sum(f => f.Volume);
                var unusual = flow.Count(f => f.IsUnusual);
                if (calls + puts > 0)
                    optionsData.Add($"{sym}: calls={calls:N0}, puts={puts:N0}, unusual={unusual}");
            }

            var prompt = "Based on the following stock and options data, estimate smart money flows for each symbol.\n\n"
                + $"Quotes:\n{string.Join("\n", quoteData)}\n\n"
                + $"Options Flow:\n{string.Join("\n", optionsData)}\n\n"
                + $"For ALL these symbols: {string.Join(", ", symbols)}\n"
                + "Return a JSON array where each element has:\n"
                + "{ \"symbol\": \"<ticker>\", \"institutionalBuy\": <number>, \"institutionalSell\": <number>, \"retailBuy\": <number>, \"retailSell\": <number>, \"netFlow\": <number>, \"signal\": \"Strong Accumulation|Accumulation|Distribution|Strong Distribution\", \"darkPoolPercent\": <30-55> }\n"
                + "Make flows realistic (millions range). Return ONLY valid JSON array.";

            var aiJson = await _ai.ChatAsync("You are an institutional flow analyst.", [("user", prompt)], ct);
            var parsed = JsonSerializer.Deserialize<JsonElement>(aiJson);

            if (parsed.ValueKind == JsonValueKind.Array)
            {
                var flows = parsed.EnumerateArray().Select(f => new SmartMoneyFlowDto(
                    f.TryGetProperty("symbol", out var sym2) ? sym2.GetString() ?? "" : "",
                    f.TryGetProperty("institutionalBuy", out var ib) ? ib.GetDecimal() : 0,
                    f.TryGetProperty("institutionalSell", out var isl) ? isl.GetDecimal() : 0,
                    f.TryGetProperty("retailBuy", out var rb) ? rb.GetDecimal() : 0,
                    f.TryGetProperty("retailSell", out var rs) ? rs.GetDecimal() : 0,
                    f.TryGetProperty("netFlow", out var nf) ? nf.GetDecimal() : 0,
                    f.TryGetProperty("signal", out var sig) ? sig.GetString() ?? "Accumulation" : "Accumulation",
                    f.TryGetProperty("darkPoolPercent", out var dp) ? dp.GetInt32() : 40
                )).OrderByDescending(fl => fl.NetFlow).ToList();

                return Ok(flows);
            }
        }
        catch { }

        var fallbackFlows = new List<SmartMoneyFlowDto>();
        foreach (var s in symbols.Take(8))
        {
            try
            {
                var q = await _marketData.GetQuote(s, ct);
                if (q is null) continue;
                var volumeScale = q.Volume / 1_000_000m;
                var changeFactor = q.ChangePercent / 100m;
                var instBuy = volumeScale * (0.4m + Math.Max(changeFactor, 0)) * 1_000_000m;
                var instSell = volumeScale * (0.4m - Math.Min(changeFactor, 0)) * 1_000_000m;
                var retBuy = volumeScale * (0.2m + Math.Max(changeFactor * 0.5m, 0)) * 1_000_000m;
                var retSell = volumeScale * (0.2m - Math.Min(changeFactor * 0.5m, 0)) * 1_000_000m;
                var netFlow = (instBuy - instSell) + (retBuy - retSell);
                var darkPool = (int)Math.Clamp(35 + changeFactor * 100, 25, 55);
                var signal = netFlow > 10_000_000 ? "Strong Accumulation" : netFlow > 0 ? "Accumulation" : netFlow < -10_000_000 ? "Strong Distribution" : "Distribution";
                fallbackFlows.Add(new SmartMoneyFlowDto(s, instBuy, instSell, retBuy, retSell, netFlow, signal, darkPool));
            }
            catch { }
        }
        return Ok(fallbackFlows.OrderByDescending(f => f.NetFlow));
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
