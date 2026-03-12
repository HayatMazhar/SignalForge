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
}
