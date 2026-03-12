using System.Text.Json;
using Microsoft.Extensions.Logging;
using SignalForge.Application.DTOs;
using SignalForge.Application.Interfaces;

namespace SignalForge.Infrastructure.Services;

public sealed class CryptoDataService : ICryptoDataService
{
    private readonly HttpClient _http;
    private readonly ILogger<CryptoDataService> _logger;

    private static readonly Dictionary<string, string> CoinIds = new(StringComparer.OrdinalIgnoreCase)
    {
        ["BTC"] = "bitcoin", ["ETH"] = "ethereum", ["BNB"] = "binancecoin", ["SOL"] = "solana",
        ["XRP"] = "ripple", ["ADA"] = "cardano", ["DOGE"] = "dogecoin", ["AVAX"] = "avalanche-2",
        ["DOT"] = "polkadot", ["MATIC"] = "matic-network", ["LINK"] = "chainlink", ["SHIB"] = "shiba-inu",
        ["UNI"] = "uniswap", ["LTC"] = "litecoin", ["ATOM"] = "cosmos", ["XLM"] = "stellar",
        ["NEAR"] = "near", ["APT"] = "aptos", ["OP"] = "optimism", ["ARB"] = "arbitrum",
        ["FIL"] = "filecoin", ["AAVE"] = "aave", ["MKR"] = "maker", ["ALGO"] = "algorand",
        ["SAND"] = "the-sandbox", ["MANA"] = "decentraland", ["AXS"] = "axie-infinity",
        ["FTM"] = "fantom", ["HBAR"] = "hedera-hashgraph", ["SUI"] = "sui",
    };

    private List<TopMoverDto>? _cachedMovers;
    private DateTime _moversExpiry = DateTime.MinValue;

    public CryptoDataService(HttpClient http, ILogger<CryptoDataService> logger)
    {
        _http = http;
        _http.BaseAddress = new Uri("https://api.coingecko.com/api/v3/");
        _http.DefaultRequestHeaders.Add("Accept", "application/json");
        _logger = logger;
    }

    public async Task<StockQuoteDto?> GetQuote(string symbol, CancellationToken ct = default)
    {
        var sym = symbol.ToUpperInvariant();
        var coinId = CoinIds.GetValueOrDefault(sym, sym.ToLowerInvariant());

        try
        {
            var json = await _http.GetStringAsync($"simple/price?ids={coinId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_high_low_24h=true", ct);
            var doc = JsonDocument.Parse(json);

            if (!doc.RootElement.TryGetProperty(coinId, out var coin))
                return null;

            var price = coin.TryGetProperty("usd", out var p) ? p.GetDecimal() : 0;
            var change24h = coin.TryGetProperty("usd_24h_change", out var c) ? c.GetDecimal() : 0;
            var vol = coin.TryGetProperty("usd_24h_vol", out var v) ? (long)v.GetDecimal() : 0;
            var high = coin.TryGetProperty("usd_24h_high", out var h) ? h.GetDecimal() : price;
            var low = coin.TryGetProperty("usd_24h_low", out var l) ? l.GetDecimal() : price;
            var changeAmt = price * change24h / 100;

            return new StockQuoteDto(sym, price, Math.Round(changeAmt, 2), Math.Round(change24h, 2), high, low, price, vol, DateTime.UtcNow);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "CoinGecko quote failed for {Symbol}", sym);
            return GetMockQuote(sym);
        }
    }

    public async Task<List<OhlcBarDto>> GetHistory(string symbol, DateTime from, DateTime to, CancellationToken ct = default)
    {
        var sym = symbol.ToUpperInvariant();
        var coinId = CoinIds.GetValueOrDefault(sym, sym.ToLowerInvariant());
        var days = Math.Max((int)(to - from).TotalDays, 1);

        try
        {
            var json = await _http.GetStringAsync($"coins/{coinId}/ohlc?vs_currency=usd&days={days}", ct);
            var arr = JsonSerializer.Deserialize<JsonElement>(json);

            if (arr.ValueKind != JsonValueKind.Array) return GetMockHistory(sym);

            return arr.EnumerateArray().Select(item =>
            {
                var vals = item.EnumerateArray().ToArray();
                if (vals.Length < 5) return null;
                var timestamp = DateTimeOffset.FromUnixTimeMilliseconds(vals[0].GetInt64()).UtcDateTime;
                return new OhlcBarDto(timestamp, vals[1].GetDecimal(), vals[2].GetDecimal(), vals[3].GetDecimal(), vals[4].GetDecimal(), 0);
            }).Where(x => x != null).Cast<OhlcBarDto>().ToList();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "CoinGecko history failed for {Symbol}", sym);
            return GetMockHistory(sym);
        }
    }

    public async Task<TechnicalDataDto?> GetTechnicalIndicators(string symbol, CancellationToken ct = default)
    {
        var history = await GetHistory(symbol, DateTime.UtcNow.AddDays(-200), DateTime.UtcNow, ct);
        if (history.Count < 20) return GetMockTechnicals(symbol);

        var closes = history.Select(h => h.Close).ToList();
        var sma20 = closes.TakeLast(20).Average();
        var sma50 = closes.Count >= 50 ? closes.TakeLast(50).Average() : sma20;
        var sma200 = closes.Count >= 200 ? closes.TakeLast(200).Average() : sma50;
        var current = closes.Last();

        var gains = new List<decimal>();
        var losses = new List<decimal>();
        for (int i = Math.Max(closes.Count - 14, 1); i < closes.Count; i++)
        {
            var diff = closes[i] - closes[i - 1];
            if (diff > 0) { gains.Add(diff); losses.Add(0); }
            else { gains.Add(0); losses.Add(Math.Abs(diff)); }
        }
        var avgGain = gains.Count > 0 ? gains.Average() : 0;
        var avgLoss = losses.Count > 0 ? losses.Average() : 1;
        var rs = avgLoss != 0 ? avgGain / avgLoss : 100;
        var rsi = 100 - (100 / (1 + rs));

        var ema12 = CalculateEma(closes, 12);
        var ema26 = CalculateEma(closes, 26);
        var macd = ema12 - ema26;

        var stdDev = (decimal)Math.Sqrt((double)closes.TakeLast(20).Select(c => (c - sma20) * (c - sma20)).Average());
        var bollingerUpper = sma20 + 2 * stdDev;
        var bollingerLower = sma20 - 2 * stdDev;

        var atrValues = new List<decimal>();
        for (int i = Math.Max(history.Count - 14, 1); i < history.Count; i++)
        {
            var tr = Math.Max(history[i].High - history[i].Low, Math.Max(Math.Abs(history[i].High - history[i - 1].Close), Math.Abs(history[i].Low - history[i - 1].Close)));
            atrValues.Add(tr);
        }
        var atr = atrValues.Count > 0 ? atrValues.Average() : 0;

        var trend = current > sma50 && rsi > 40 ? "Bullish" : current < sma50 && rsi < 60 ? "Bearish" : "Neutral";

        return new TechnicalDataDto(Math.Round(rsi, 1), Math.Round(macd, 2), 0, Math.Round(sma20, 2), Math.Round(sma50, 2), Math.Round(sma200, 2), Math.Round(bollingerUpper, 2), Math.Round(bollingerLower, 2), Math.Round(atr, 2), trend);
    }

    public async Task<List<StockDto>> SearchCrypto(string query, CancellationToken ct = default)
    {
        try
        {
            var json = await _http.GetStringAsync($"search?query={Uri.EscapeDataString(query)}", ct);
            var doc = JsonDocument.Parse(json);
            var coins = doc.RootElement.TryGetProperty("coins", out var c) && c.ValueKind == JsonValueKind.Array ? c : default;
            if (coins.ValueKind != JsonValueKind.Array) return [];

            return coins.EnumerateArray().Take(20).Select(coin =>
            {
                var sym = coin.TryGetProperty("symbol", out var s) ? s.GetString()?.ToUpperInvariant() ?? "" : "";
                var name = coin.TryGetProperty("name", out var n) ? n.GetString() ?? "" : "";
                var mcRank = coin.TryGetProperty("market_cap_rank", out var r) ? r.GetInt32() : 9999;
                var thumb = coin.TryGetProperty("thumb", out var t) ? t.GetString() : null;
                return new StockDto(Guid.NewGuid(), sym, name, "Crypto", "DEX", mcRank, thumb);
            }).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "CoinGecko search failed for {Query}", query);
            return CoinIds.Keys
                .Where(k => k.Contains(query.ToUpperInvariant()))
                .Select(k => new StockDto(Guid.NewGuid(), k, CoinIds[k], "Crypto", "DEX", 0, null))
                .ToList();
        }
    }

    public async Task<List<TopMoverDto>> GetTopMovers(CancellationToken ct = default)
    {
        if (_cachedMovers != null && DateTime.UtcNow < _moversExpiry)
            return _cachedMovers.Where(m => m.ChangePercent > 0).OrderByDescending(m => m.ChangePercent).Take(15).ToList();

        try
        {
            var json = await _http.GetStringAsync("coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h", ct);
            var arr = JsonSerializer.Deserialize<JsonElement>(json);
            if (arr.ValueKind != JsonValueKind.Array) return GetMockMovers(true);

            _cachedMovers = arr.EnumerateArray().Select(coin =>
            {
                var sym = coin.TryGetProperty("symbol", out var s) ? s.GetString()?.ToUpperInvariant() ?? "" : "";
                var name = coin.TryGetProperty("name", out var n) ? n.GetString() ?? "" : "";
                var price = coin.TryGetProperty("current_price", out var p) ? p.GetDecimal() : 0;
                var change = coin.TryGetProperty("price_change_percentage_24h", out var c) ? c.GetDecimal() : 0;
                return new TopMoverDto(sym, name, price, Math.Round(change, 2));
            }).ToList();
            _moversExpiry = DateTime.UtcNow.AddMinutes(2);

            return _cachedMovers.Where(m => m.ChangePercent > 0).OrderByDescending(m => m.ChangePercent).Take(15).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "CoinGecko top movers failed");
            return GetMockMovers(true);
        }
    }

    public async Task<List<TopMoverDto>> GetTopLosers(CancellationToken ct = default)
    {
        await GetTopMovers(ct);
        if (_cachedMovers != null)
            return _cachedMovers.Where(m => m.ChangePercent < 0).OrderBy(m => m.ChangePercent).Take(15).ToList();
        return GetMockMovers(false);
    }

    private static decimal CalculateEma(List<decimal> data, int period)
    {
        if (data.Count < period) return data.Last();
        var multiplier = 2m / (period + 1);
        var ema = data.Take(period).Average();
        for (int i = period; i < data.Count; i++)
            ema = (data[i] - ema) * multiplier + ema;
        return ema;
    }

    private static StockQuoteDto GetMockQuote(string symbol)
    {
        var rng = new Random(symbol.GetHashCode() + DateTime.UtcNow.DayOfYear);
        var price = symbol switch { "BTC" => 65000 + rng.Next(-2000, 2000), "ETH" => 3500 + rng.Next(-200, 200), "SOL" => 150 + rng.Next(-20, 20), _ => 1 + rng.Next(1, 500) };
        var change = (decimal)(rng.NextDouble() * 10 - 5);
        return new StockQuoteDto(symbol, price, Math.Round(price * change / 100, 2), Math.Round(change, 2), price * 1.03m, price * 0.97m, price, rng.Next(100000, 5000000), DateTime.UtcNow);
    }

    private static List<OhlcBarDto> GetMockHistory(string symbol)
    {
        var rng = new Random(symbol.GetHashCode());
        var price = symbol switch { "BTC" => 65000m, "ETH" => 3500m, _ => 100m };
        return Enumerable.Range(0, 30).Select(i =>
        {
            var d = DateTime.UtcNow.AddDays(-30 + i);
            var change = (decimal)(rng.NextDouble() * 6 - 3) / 100;
            price *= (1 + change);
            return new OhlcBarDto(d, price * 0.99m, price * 1.02m, price * 0.97m, price, rng.Next(10000, 100000));
        }).ToList();
    }

    private static TechnicalDataDto GetMockTechnicals(string symbol)
    {
        var rng = new Random(symbol.GetHashCode() + DateTime.UtcNow.DayOfYear);
        return new TechnicalDataDto(30 + rng.Next(40), (decimal)(rng.NextDouble() * 200 - 100), 0, 0, 0, 0, 0, 0, (decimal)(rng.NextDouble() * 1000), rng.Next(2) == 0 ? "Bullish" : "Bearish");
    }

    private static List<TopMoverDto> GetMockMovers(bool gainers)
    {
        var rng = new Random(DateTime.UtcNow.DayOfYear + (gainers ? 1 : 2));
        var symbols = new[] { ("BTC", "Bitcoin", 65000m), ("ETH", "Ethereum", 3500m), ("SOL", "Solana", 150m), ("XRP", "Ripple", 0.55m), ("DOGE", "Dogecoin", 0.12m), ("ADA", "Cardano", 0.45m), ("AVAX", "Avalanche", 35m), ("DOT", "Polkadot", 7m) };
        return symbols.Select(s =>
        {
            var change = gainers ? (decimal)(rng.NextDouble() * 15 + 0.5) : -(decimal)(rng.NextDouble() * 15 + 0.5);
            return new TopMoverDto(s.Item1, s.Item2, s.Item3, Math.Round(change, 2));
        }).ToList();
    }
}
