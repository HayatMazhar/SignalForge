using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SignalForge.Application.DTOs;
using SignalForge.Application.Interfaces;
using SignalForge.Domain.Enums;

namespace SignalForge.Infrastructure.Services;

public class UnusualWhalesService : IOptionsFlowService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<UnusualWhalesService> _logger;
    private readonly string _apiKey;
    private readonly bool _useMockData;

    private Dictionary<string, List<MockOptionsFlow>>? _flowCache;

    public UnusualWhalesService(HttpClient httpClient, IConfiguration config, ILogger<UnusualWhalesService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
        _apiKey = config["UnusualWhales:ApiKey"] ?? "";
        _useMockData = string.IsNullOrEmpty(_apiKey) || _apiKey.Contains("your-");
        if (!_useMockData)
        {
            _httpClient.BaseAddress = new Uri("https://api.unusualwhales.com/");
            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {_apiKey}");
        }
    }

    public async Task<List<OptionsFlowDto>> GetUnusualFlow(CancellationToken cancellationToken = default)
    {
        if (_useMockData) return GetMockUnusualFlow();
        try
        {
            var response = await _httpClient.GetAsync("api/stock/flow/recent", cancellationToken);
            if (!response.IsSuccessStatusCode) return GetMockUnusualFlow();
            var json = await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken);
            if (!json.TryGetProperty("data", out var data)) return GetMockUnusualFlow();
            return ParseFlows(data);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "API failed for unusual flow, falling back to mock data");
            return GetMockUnusualFlow();
        }
    }

    public async Task<List<OptionsFlowDto>> GetSymbolFlow(string symbol, CancellationToken cancellationToken = default)
    {
        if (_useMockData) return GetMockSymbolFlow(symbol);
        try
        {
            var response = await _httpClient.GetAsync($"api/stock/{symbol}/flow", cancellationToken);
            if (!response.IsSuccessStatusCode) return GetMockSymbolFlow(symbol);
            var json = await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken);
            if (!json.TryGetProperty("data", out var data)) return GetMockSymbolFlow(symbol);
            return ParseFlows(data);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "API failed for flow {Symbol}, falling back to mock data", symbol);
            return GetMockSymbolFlow(symbol);
        }
    }

    #region Mock Data

    private void EnsureFlowLoaded()
    {
        _flowCache ??= MockDataProvider.LoadJson<Dictionary<string, List<MockOptionsFlow>>>("options_flow.json", _logger);
    }

    private List<OptionsFlowDto> GetMockUnusualFlow()
    {
        EnsureFlowLoaded();
        if (_flowCache is null) return [];
        if (_flowCache.TryGetValue("UNUSUAL", out var unusual))
            return unusual.Select(ToDto).ToList();

        return _flowCache
            .Where(kv => kv.Key != "UNUSUAL")
            .SelectMany(kv => kv.Value)
            .Where(f => f.IsUnusual)
            .OrderByDescending(f => f.Volume)
            .Take(20)
            .Select(ToDto)
            .ToList();
    }

    private List<OptionsFlowDto> GetMockSymbolFlow(string symbol)
    {
        EnsureFlowLoaded();
        var upper = symbol.ToUpperInvariant();
        if (_flowCache is null || !_flowCache.TryGetValue(upper, out var flows))
            return [];
        return flows.Select(ToDto).ToList();
    }

    private static OptionsFlowDto ToDto(MockOptionsFlow f) => new(
        Guid.NewGuid(), f.Symbol, f.Strike,
        DateTime.TryParse(f.Expiry, out var exp) ? exp : DateTime.UtcNow.AddDays(30),
        string.Equals(f.Type, "Put", StringComparison.OrdinalIgnoreCase) ? OptionType.Put : OptionType.Call,
        f.Volume, f.OpenInterest, f.ImpliedVolatility, f.Premium, f.IsUnusual,
        DateTime.TryParse(f.DetectedAt, out var det) ? det : DateTime.UtcNow
    );

    private record MockOptionsFlow(
        string Symbol, decimal Strike, string Expiry, string Type,
        long Volume, long OpenInterest, decimal ImpliedVolatility,
        decimal Premium, bool IsUnusual, string DetectedAt);

    #endregion

    private static List<OptionsFlowDto> ParseFlows(JsonElement data)
    {
        return data.EnumerateArray().Select(f => new OptionsFlowDto(
            Guid.NewGuid(),
            f.TryGetProperty("ticker", out var t) ? t.GetString() ?? "" : "",
            f.TryGetProperty("strike", out var s) ? s.GetDecimal() : 0,
            f.TryGetProperty("expires", out var exp) ? DateTime.Parse(exp.GetString() ?? DateTime.UtcNow.ToString()) : DateTime.UtcNow,
            f.TryGetProperty("put_call", out var pc) && pc.GetString()?.ToUpper() == "PUT" ? OptionType.Put : OptionType.Call,
            f.TryGetProperty("volume", out var v) ? v.GetInt64() : 0,
            f.TryGetProperty("open_interest", out var oi) ? oi.GetInt64() : 0,
            f.TryGetProperty("implied_volatility", out var iv) ? iv.GetDecimal() : 0,
            f.TryGetProperty("premium", out var p) ? p.GetDecimal() : 0,
            true, DateTime.UtcNow
        )).ToList();
    }
}
