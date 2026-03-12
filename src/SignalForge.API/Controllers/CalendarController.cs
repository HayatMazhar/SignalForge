using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SignalForge.Application.Interfaces;

namespace SignalForge.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CalendarController : ControllerBase
{
    private readonly IAISignalService _ai;
    private readonly IMarketDataService _marketData;
    private readonly ICacheService _cache;
    private readonly ILogger<CalendarController> _logger;

    public CalendarController(
        IAISignalService ai,
        IMarketDataService marketData,
        ICacheService cache,
        ILogger<CalendarController> logger)
    {
        _ai = ai;
        _marketData = marketData;
        _cache = cache;
        _logger = logger;
    }

    [HttpGet("earnings")]
    public async Task<IActionResult> GetEarnings([FromQuery] string? filter, CancellationToken ct)
    {
        const string cacheKey = "calendar:earnings";
        var cached = await _cache.GetAsync<List<JsonElement>>(cacheKey, ct);
        if (cached is not null)
        {
            if (filter == "past")
                return Ok(cached.Where(e => e.TryGetProperty("isUpcoming", out var u) && !u.GetBoolean()));
            if (filter == "upcoming")
                return Ok(cached.Where(e => e.TryGetProperty("isUpcoming", out var u) && u.GetBoolean()));
            return Ok(cached);
        }

        try
        {
            var movers = await _marketData.GetTopMovers(ct);
            var topSymbols = movers.Take(10).Select(m => m.Symbol).ToList();

            var prompt = $"Today is {DateTime.UtcNow:yyyy-MM-dd}. Generate a realistic earnings calendar.\n\n"
                + $"Active stocks: {string.Join(", ", topSymbols)}\n\n"
                + "Return a JSON array of 20 earnings entries (10 upcoming, 10 recent past). Each object:\n"
                + "{ \"symbol\": string, \"company\": string, \"date\": \"YYYY-MM-DD\", \"time\": \"BMO\"|\"AMC\", "
                + "\"epsEstimate\": number, \"epsActual\": number|null, \"revenueEstimate\": number, \"revenueActual\": number|null, "
                + "\"surprise\": number|null, \"isUpcoming\": boolean }\n"
                + "For upcoming: epsActual/revenueActual/surprise should be null. "
                + "For past: include actual values and surprise %. Use real well-known companies. "
                + "Return ONLY valid JSON array.";

            var aiJson = await _ai.ChatAsync("You are a financial data analyst.", [("user", prompt)], ct);
            var parsed = JsonSerializer.Deserialize<List<JsonElement>>(aiJson);

            if (parsed is { Count: > 0 })
            {
                await _cache.SetAsync(cacheKey, parsed, TimeSpan.FromHours(4), ct);

                if (filter == "past")
                    return Ok(parsed.Where(e => e.TryGetProperty("isUpcoming", out var u) && !u.GetBoolean()));
                if (filter == "upcoming")
                    return Ok(parsed.Where(e => e.TryGetProperty("isUpcoming", out var u) && u.GetBoolean()));
                return Ok(parsed);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "AI earnings generation failed, using mock");
        }

        var fallback = Infrastructure.Services.MockDataProvider.LoadJson<List<object>>("earnings.json", _logger);
        return Ok(fallback ?? []);
    }

    [HttpGet("economic")]
    public async Task<IActionResult> GetEconomicCalendar(CancellationToken ct)
    {
        const string cacheKey = "calendar:economic";
        var cached = await _cache.GetAsync<List<JsonElement>>(cacheKey, ct);
        if (cached is not null) return Ok(cached);

        try
        {
            var prompt = $"Today is {DateTime.UtcNow:yyyy-MM-dd}. Generate a realistic economic calendar for the next 30 days.\n\n"
                + "Return a JSON array of 15 economic events. Each object:\n"
                + "{ \"id\": string, \"event\": string, \"date\": \"YYYY-MM-DD\", \"time\": \"HH:MM ET\", "
                + "\"impact\": \"High\"|\"Medium\"|\"Low\", \"forecast\": string, \"previous\": string, \"actual\": string|null, "
                + "\"country\": \"US\" }\n"
                + "Include real recurring events: FOMC decisions, CPI releases, NFP (Non-Farm Payrolls), GDP, "
                + "Jobless Claims, PCE, ISM Manufacturing, Retail Sales, Housing Starts. "
                + "Use realistic dates and values. Return ONLY valid JSON array.";

            var aiJson = await _ai.ChatAsync("You are an economic data analyst.", [("user", prompt)], ct);
            var parsed = JsonSerializer.Deserialize<List<JsonElement>>(aiJson);

            if (parsed is { Count: > 0 })
            {
                await _cache.SetAsync(cacheKey, parsed, TimeSpan.FromHours(6), ct);
                return Ok(parsed);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "AI economic calendar generation failed, using mock");
        }

        var fallback = Infrastructure.Services.MockDataProvider.LoadJson<List<object>>("economic_calendar.json", _logger);
        return Ok(fallback ?? []);
    }

    [HttpGet("insider-trades")]
    public async Task<IActionResult> GetInsiderTrades(CancellationToken ct)
    {
        const string cacheKey = "calendar:insiders";
        var cached = await _cache.GetAsync<List<JsonElement>>(cacheKey, ct);
        if (cached is not null) return Ok(cached);

        try
        {
            var movers = await _marketData.GetTopMovers(ct);
            var topSymbols = movers.Take(15).Select(m => $"{m.Symbol} ({m.Name})").ToList();

            var prompt = $"Today is {DateTime.UtcNow:yyyy-MM-dd}. Generate realistic recent insider trading data.\n\n"
                + $"Active stocks: {string.Join(", ", topSymbols)}\n\n"
                + "Return a JSON array of 20 insider transactions from the past 30 days. Each object:\n"
                + "{ \"id\": string, \"symbol\": string, \"insiderName\": string, \"title\": string (e.g. CEO, CFO, Director), "
                + "\"transactionType\": \"Purchase\"|\"Sale\", \"date\": \"YYYY-MM-DD\", "
                + "\"shares\": number, \"pricePerShare\": number, \"totalValue\": number }\n"
                + "Use realistic executive names, prices matching current market levels, and typical insider transaction sizes. "
                + "Mix purchases and sales. Return ONLY valid JSON array.";

            var aiJson = await _ai.ChatAsync("You are an SEC filings analyst.", [("user", prompt)], ct);
            var parsed = JsonSerializer.Deserialize<List<JsonElement>>(aiJson);

            if (parsed is { Count: > 0 })
            {
                await _cache.SetAsync(cacheKey, parsed, TimeSpan.FromHours(2), ct);
                return Ok(parsed);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "AI insider trades generation failed, using mock");
        }

        var fallback = Infrastructure.Services.MockDataProvider.LoadJson<List<object>>("insider_trades.json", _logger);
        return Ok(fallback ?? []);
    }

    [HttpGet("dividends")]
    public async Task<IActionResult> GetDividends(CancellationToken ct)
    {
        const string cacheKey = "calendar:dividends";
        var cached = await _cache.GetAsync<List<JsonElement>>(cacheKey, ct);
        if (cached is not null) return Ok(cached);

        try
        {
            var prompt = $"Today is {DateTime.UtcNow:yyyy-MM-dd}. Generate dividend data for 15 major dividend-paying stocks.\n\n"
                + "Return a JSON array. Each object:\n"
                + "{ \"symbol\": string, \"company\": string, \"yield\": number, \"annualDividend\": number, "
                + "\"payoutRatio\": number, \"exDate\": \"YYYY-MM-DD\", \"payDate\": \"YYYY-MM-DD\", "
                + "\"consecutiveYears\": number, \"frequency\": \"Quarterly\" }\n"
                + "Include well-known dividend stocks: JNJ, PG, KO, PEP, XOM, CVX, ABBV, MRK, VZ, T, O, SCHD, "
                + "HD, MCD, MSFT. Use current realistic yields and payout ratios. Return ONLY valid JSON array.";

            var aiJson = await _ai.ChatAsync("You are a dividend research analyst.", [("user", prompt)], ct);
            var parsed = JsonSerializer.Deserialize<List<JsonElement>>(aiJson);

            if (parsed is { Count: > 0 })
            {
                await _cache.SetAsync(cacheKey, parsed, TimeSpan.FromHours(12), ct);
                return Ok(parsed);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "AI dividends generation failed, using mock");
        }

        var fallback = Infrastructure.Services.MockDataProvider.LoadJson<Dictionary<string, object>>("dividends.json", _logger);
        return Ok(fallback ?? new Dictionary<string, object>());
    }

    [HttpGet("dividends/{symbol}")]
    public async Task<IActionResult> GetStockDividend(string symbol, CancellationToken ct)
    {
        var result = await GetDividends(ct);
        if (result is OkObjectResult ok && ok.Value is List<JsonElement> list)
        {
            var match = list.FirstOrDefault(e =>
                e.TryGetProperty("symbol", out var s) &&
                s.GetString()?.Equals(symbol, StringComparison.OrdinalIgnoreCase) == true);
            if (match.ValueKind != JsonValueKind.Undefined)
                return Ok(match);
        }
        return NotFound();
    }

    [HttpGet("ipos")]
    public async Task<IActionResult> GetIpos(CancellationToken ct)
    {
        const string cacheKey = "calendar:ipos";
        var cached = await _cache.GetAsync<List<JsonElement>>(cacheKey, ct);
        if (cached is not null) return Ok(cached);

        try
        {
            var prompt = $"Today is {DateTime.UtcNow:yyyy-MM-dd}. Generate a realistic IPO calendar.\n\n"
                + "Return a JSON array of 10 IPOs (mix of upcoming, filed, and expected). Each object:\n"
                + "{ \"id\": string, \"company\": string, \"symbol\": string, \"status\": \"Upcoming\"|\"Filed\"|\"Expected\", "
                + "\"expectedDate\": \"YYYY-MM-DD\"|\"Q1 2026\"|\"Q2 2026\", \"exchange\": \"NYSE\"|\"NASDAQ\", "
                + "\"priceRange\": string (e.g. \"$28-$32\"), \"valuation\": string (e.g. \"$5B\"), "
                + "\"sector\": string, \"description\": string (1 sentence) }\n"
                + "Include a mix of well-known private companies that could realistically IPO. "
                + "Return ONLY valid JSON array.";

            var aiJson = await _ai.ChatAsync("You are an IPO market analyst.", [("user", prompt)], ct);
            var parsed = JsonSerializer.Deserialize<List<JsonElement>>(aiJson);

            if (parsed is { Count: > 0 })
            {
                await _cache.SetAsync(cacheKey, parsed, TimeSpan.FromHours(12), ct);
                return Ok(parsed);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "AI IPO calendar generation failed, using mock");
        }

        var fallback = Infrastructure.Services.MockDataProvider.LoadJson<List<object>>("ipos.json", _logger);
        return Ok(fallback ?? []);
    }
}
