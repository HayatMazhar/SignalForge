using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SignalForge.Application.DTOs;
using SignalForge.Application.Interfaces;

namespace SignalForge.Infrastructure.Services;

public class PolygonMarketDataService : IMarketDataService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<PolygonMarketDataService> _logger;
    private readonly string _apiKey;
    private readonly bool _useMockData;

    private Dictionary<string, MockQuote>? _quotesCache;
    private Dictionary<string, List<MockBar>>? _historyCache;
    private MockMoversData? _moversCache;

    public bool IsMockMode => _useMockData;

    public PolygonMarketDataService(HttpClient httpClient, IConfiguration config, ILogger<PolygonMarketDataService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
        _apiKey = config["Polygon:ApiKey"] ?? "";
        _useMockData = string.IsNullOrEmpty(_apiKey) || _apiKey.Contains("your-");
        if (!_useMockData)
        {
            _httpClient.BaseAddress = new Uri("https://api.polygon.io/");
        }
    }

    public async Task<StockQuoteDto?> GetQuote(string symbol, CancellationToken cancellationToken = default)
    {
        if (_useMockData) return GetMockQuote(symbol);
        try
        {
            var response = await _httpClient.GetAsync($"v2/aggs/ticker/{symbol}/prev?apiKey={_apiKey}", cancellationToken);
            if (!response.IsSuccessStatusCode) return GetMockQuote(symbol);
            var json = await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken);
            var results = json.GetProperty("results");
            if (results.GetArrayLength() == 0) return GetMockQuote(symbol);
            var bar = results[0];
            var close = bar.GetProperty("c").GetDecimal();
            var open = bar.GetProperty("o").GetDecimal();
            var change = close - open;
            var changePct = open != 0 ? change / open * 100 : 0;
            return new StockQuoteDto(symbol, close, change, Math.Round(changePct, 2),
                bar.GetProperty("h").GetDecimal(), bar.GetProperty("l").GetDecimal(),
                open, bar.GetProperty("v").GetInt64(), DateTime.UtcNow);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "API failed for quote {Symbol}, falling back to mock data", symbol);
            return GetMockQuote(symbol);
        }
    }

    public async Task<List<OhlcBarDto>> GetHistory(string symbol, DateTime from, DateTime to, CancellationToken cancellationToken = default)
    {
        if (_useMockData) return GetMockHistory(symbol);
        try
        {
            var fromStr = from.ToString("yyyy-MM-dd");
            var toStr = to.ToString("yyyy-MM-dd");
            var response = await _httpClient.GetAsync(
                $"v2/aggs/ticker/{symbol}/range/1/day/{fromStr}/{toStr}?apiKey={_apiKey}&limit=5000", cancellationToken);
            if (!response.IsSuccessStatusCode) return GetMockHistory(symbol);
            var json = await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken);
            if (!json.TryGetProperty("results", out var results)) return GetMockHistory(symbol);
            return results.EnumerateArray().Select(bar => new OhlcBarDto(
                DateTimeOffset.FromUnixTimeMilliseconds(bar.GetProperty("t").GetInt64()).UtcDateTime,
                bar.GetProperty("o").GetDecimal(), bar.GetProperty("h").GetDecimal(),
                bar.GetProperty("l").GetDecimal(), bar.GetProperty("c").GetDecimal(),
                bar.GetProperty("v").GetInt64()
            )).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "API failed for history {Symbol}, falling back to mock data", symbol);
            return GetMockHistory(symbol);
        }
    }

    public async Task<TechnicalDataDto?> GetTechnicalIndicators(string symbol, CancellationToken cancellationToken = default)
    {
        try
        {
            var bars = _useMockData
                ? GetMockHistory(symbol)
                : await GetHistory(symbol, DateTime.UtcNow.AddDays(-250), DateTime.UtcNow, cancellationToken);

            if (bars.Count < 20) return GetFallbackTechnicals(symbol);

            var closes = bars.Select(b => b.Close).ToList();
            var rsi = CalculateRsi(closes, 14);
            var (macd, signal) = CalculateMacd(closes);
            var sma20 = closes.TakeLast(20).Average();
            var sma50 = closes.Count >= 50 ? closes.TakeLast(50).Average() : sma20;
            var sma200 = closes.Count >= 200 ? closes.TakeLast(200).Average() : sma50;
            var std20 = CalculateStdDev(closes.TakeLast(20).ToList());
            var bollingerUpper = sma20 + 2 * std20;
            var bollingerLower = sma20 - 2 * std20;
            var atr = CalculateAtr(bars.TakeLast(14).ToList());
            var trend = closes.Last() > sma50 ? "Bullish" : "Bearish";

            return new TechnicalDataDto(
                Math.Round(rsi, 2), Math.Round(macd, 2), Math.Round(signal, 2),
                Math.Round(sma20, 2), Math.Round(sma50, 2), Math.Round(sma200, 2),
                Math.Round(bollingerUpper, 2), Math.Round(bollingerLower, 2),
                Math.Round(atr, 2), trend);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get technicals for {Symbol}", symbol);
            return GetFallbackTechnicals(symbol);
        }
    }

    public async Task<List<StockDto>> SearchStocks(string query, CancellationToken cancellationToken = default)
    {
        if (_useMockData) return SearchMockStocks(query);
        try
        {
            var response = await _httpClient.GetAsync(
                $"v3/reference/tickers?search={query}&active=true&limit=10&apiKey={_apiKey}", cancellationToken);
            if (!response.IsSuccessStatusCode) return SearchMockStocks(query);
            var json = await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken);
            if (!json.TryGetProperty("results", out var results)) return SearchMockStocks(query);
            return results.EnumerateArray().Select(t => new StockDto(
                Guid.NewGuid(), t.GetProperty("ticker").GetString() ?? "",
                t.GetProperty("name").GetString() ?? "",
                t.TryGetProperty("sic_description", out var sector) ? sector.GetString() ?? "" : "",
                t.TryGetProperty("primary_exchange", out var ex) ? ex.GetString() ?? "" : "",
                t.TryGetProperty("market_cap", out var mc) ? mc.GetDecimal() : 0, null
            )).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "API failed for search, falling back to mock data");
            return SearchMockStocks(query);
        }
    }

    public async Task<List<TopMoverDto>> GetTopMovers(CancellationToken cancellationToken = default)
    {
        if (_useMockData) return GetMockTopMovers();
        try
        {
            var response = await _httpClient.GetAsync(
                $"v2/snapshot/locale/us/markets/stocks/gainers?apiKey={_apiKey}", cancellationToken);
            if (!response.IsSuccessStatusCode) return GetMockTopMovers();
            var json = await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken);
            if (!json.TryGetProperty("tickers", out var tickers)) return GetMockTopMovers();
            return tickers.EnumerateArray().Take(20).Select(t => new TopMoverDto(
                t.GetProperty("ticker").GetString() ?? "", "",
                t.GetProperty("day").GetProperty("c").GetDecimal(),
                t.GetProperty("todaysChangePerc").GetDecimal()
            )).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "API failed for top movers, falling back to mock data");
            return GetMockTopMovers();
        }
    }

    #region Mock Data Helpers

    private StockQuoteDto? GetMockQuote(string symbol)
    {
        _quotesCache ??= MockDataProvider.LoadJson<Dictionary<string, MockQuote>>("quotes.json", _logger);
        if (_quotesCache is null || !_quotesCache.TryGetValue(symbol.ToUpperInvariant(), out var q))
        {
            return null;
        }
        return new StockQuoteDto(q.Symbol, q.Price, q.Change, q.ChangePercent, q.High, q.Low, q.Open, q.Volume, DateTime.UtcNow);
    }

    private List<OhlcBarDto> GetMockHistory(string symbol)
    {
        _historyCache ??= MockDataProvider.LoadJson<Dictionary<string, List<MockBar>>>("history.json", _logger);
        if (_historyCache is null || !_historyCache.TryGetValue(symbol.ToUpperInvariant(), out var bars))
            return [];
        return bars.Select(b => new OhlcBarDto(DateTime.Parse(b.Date), b.Open, b.High, b.Low, b.Close, b.Volume)).ToList();
    }

    private List<TopMoverDto> GetMockTopMovers()
    {
        _moversCache ??= MockDataProvider.LoadJson<MockMoversData>("top_movers.json", _logger);
        if (_moversCache is null) return [];
        var all = new List<TopMoverDto>();
        if (_moversCache.Gainers is not null)
            all.AddRange(_moversCache.Gainers.Select(g => new TopMoverDto(g.Symbol, g.Name, g.Price, g.ChangePercent)));
        if (_moversCache.Losers is not null)
            all.AddRange(_moversCache.Losers.Select(l => new TopMoverDto(l.Symbol, l.Name, l.Price, l.ChangePercent)));
        return all;
    }

    private static readonly Dictionary<string, (string Name, string Sector, string Exchange, decimal MarketCap)> StockInfo = new()
    {
        ["AAPL"] = ("Apple Inc.", "Technology", "NASDAQ", 2900000000000m),
        ["MSFT"] = ("Microsoft Corporation", "Technology", "NASDAQ", 2800000000000m),
        ["GOOGL"] = ("Alphabet Inc.", "Technology", "NASDAQ", 1700000000000m),
        ["AMZN"] = ("Amazon.com Inc.", "Consumer Cyclical", "NASDAQ", 1500000000000m),
        ["NVDA"] = ("NVIDIA Corporation", "Technology", "NASDAQ", 1200000000000m),
        ["TSLA"] = ("Tesla Inc.", "Consumer Cyclical", "NASDAQ", 800000000000m),
        ["META"] = ("Meta Platforms Inc.", "Technology", "NASDAQ", 750000000000m),
        ["BRK.B"] = ("Berkshire Hathaway", "Financial Services", "NYSE", 700000000000m),
        ["JPM"] = ("JPMorgan Chase & Co.", "Financial Services", "NYSE", 430000000000m),
        ["V"] = ("Visa Inc.", "Financial Services", "NYSE", 470000000000m),
        ["JNJ"] = ("Johnson & Johnson", "Healthcare", "NYSE", 420000000000m),
        ["WMT"] = ("Walmart Inc.", "Consumer Defensive", "NYSE", 400000000000m),
        ["PG"] = ("Procter & Gamble", "Consumer Defensive", "NYSE", 350000000000m),
        ["MA"] = ("Mastercard Inc.", "Financial Services", "NYSE", 340000000000m),
        ["UNH"] = ("UnitedHealth Group", "Healthcare", "NYSE", 450000000000m),
        ["HD"] = ("Home Depot Inc.", "Consumer Cyclical", "NYSE", 300000000000m),
        ["DIS"] = ("Walt Disney Co.", "Communication Services", "NYSE", 180000000000m),
        ["PYPL"] = ("PayPal Holdings", "Financial Services", "NASDAQ", 80000000000m),
        ["NFLX"] = ("Netflix Inc.", "Communication Services", "NASDAQ", 200000000000m),
        ["ADBE"] = ("Adobe Inc.", "Technology", "NASDAQ", 220000000000m),
        ["CRM"] = ("Salesforce Inc.", "Technology", "NYSE", 210000000000m),
        ["INTC"] = ("Intel Corporation", "Technology", "NASDAQ", 120000000000m),
        ["AMD"] = ("Advanced Micro Devices", "Technology", "NASDAQ", 180000000000m),
        ["CSCO"] = ("Cisco Systems", "Technology", "NASDAQ", 200000000000m),
        ["ORCL"] = ("Oracle Corporation", "Technology", "NYSE", 290000000000m),
        ["IBM"] = ("International Business Machines", "Technology", "NYSE", 130000000000m),
        ["QCOM"] = ("Qualcomm Inc.", "Technology", "NASDAQ", 150000000000m),
        ["TXN"] = ("Texas Instruments", "Technology", "NASDAQ", 160000000000m),
        ["AVGO"] = ("Broadcom Inc.", "Technology", "NASDAQ", 350000000000m),
        ["COST"] = ("Costco Wholesale", "Consumer Defensive", "NASDAQ", 250000000000m),
        ["ABBV"] = ("AbbVie Inc.", "Healthcare", "NYSE", 250000000000m),
        ["PFE"] = ("Pfizer Inc.", "Healthcare", "NYSE", 160000000000m),
        ["MRK"] = ("Merck & Co.", "Healthcare", "NYSE", 270000000000m),
        ["LLY"] = ("Eli Lilly and Co.", "Healthcare", "NYSE", 400000000000m),
        ["TMO"] = ("Thermo Fisher Scientific", "Healthcare", "NYSE", 200000000000m),
        ["CMCSA"] = ("Comcast Corporation", "Communication Services", "NASDAQ", 150000000000m),
        ["VZ"] = ("Verizon Communications", "Communication Services", "NYSE", 150000000000m),
        ["T"] = ("AT&T Inc.", "Communication Services", "NYSE", 110000000000m),
        ["BA"] = ("Boeing Company", "Industrials", "NYSE", 120000000000m),
        ["CAT"] = ("Caterpillar Inc.", "Industrials", "NYSE", 130000000000m),
        ["GE"] = ("General Electric", "Industrials", "NYSE", 120000000000m),
        ["MMM"] = ("3M Company", "Industrials", "NYSE", 60000000000m),
        ["XOM"] = ("Exxon Mobil Corp.", "Energy", "NYSE", 450000000000m),
        ["CVX"] = ("Chevron Corporation", "Energy", "NYSE", 300000000000m),
        ["COP"] = ("ConocoPhillips", "Energy", "NYSE", 130000000000m),
        ["GS"] = ("Goldman Sachs", "Financial Services", "NYSE", 110000000000m),
        ["MS"] = ("Morgan Stanley", "Financial Services", "NYSE", 140000000000m),
        ["BAC"] = ("Bank of America", "Financial Services", "NYSE", 230000000000m),
        ["C"] = ("Citigroup Inc.", "Financial Services", "NYSE", 90000000000m),
        ["COIN"] = ("Coinbase Global", "Financial Services", "NASDAQ", 40000000000m),
    };

    private List<StockDto> SearchMockStocks(string query)
    {
        var q = query.Trim().ToUpperInvariant();
        if (string.IsNullOrEmpty(q)) return StockInfo.Take(10)
            .Select(kv => new StockDto(Guid.NewGuid(), kv.Key, kv.Value.Name, kv.Value.Sector, kv.Value.Exchange, kv.Value.MarketCap, null)).ToList();

        var exact = StockInfo.Where(kv => kv.Key == q).ToList();
        var startsWith = StockInfo.Where(kv => kv.Key.StartsWith(q) && kv.Key != q).ToList();
        var contains = StockInfo.Where(kv => (kv.Key.Contains(q) || kv.Value.Name.ToUpperInvariant().Contains(q)) && !kv.Key.StartsWith(q)).ToList();

        return exact.Concat(startsWith).Concat(contains)
            .Select(kv => new StockDto(Guid.NewGuid(), kv.Key, kv.Value.Name, kv.Value.Sector, kv.Value.Exchange, kv.Value.MarketCap, null))
            .Take(15)
            .ToList();
    }

    private static TechnicalDataDto? GetFallbackTechnicals(string symbol)
    {
        return null;
    }

    #endregion

    #region Technical Indicators

    private static decimal CalculateRsi(List<decimal> closes, int period)
    {
        if (closes.Count < period + 1) return 50;
        decimal gainSum = 0, lossSum = 0;
        for (int i = closes.Count - period; i < closes.Count; i++)
        {
            var diff = closes[i] - closes[i - 1];
            if (diff >= 0) gainSum += diff; else lossSum += Math.Abs(diff);
        }
        var avgGain = gainSum / period;
        var avgLoss = lossSum / period;
        if (avgLoss == 0) return 100;
        return 100 - (100 / (1 + avgGain / avgLoss));
    }

    private static (decimal Macd, decimal Signal) CalculateMacd(List<decimal> closes)
    {
        var ema12 = CalculateEma(closes, 12);
        var ema26 = CalculateEma(closes, 26);
        var macd = ema12 - ema26;
        return (macd, macd * 0.8m);
    }

    private static decimal CalculateEma(List<decimal> data, int period)
    {
        if (data.Count < period) return data.Last();
        var multiplier = 2.0m / (period + 1);
        var ema = data.Take(period).Average();
        foreach (var val in data.Skip(period)) ema = (val - ema) * multiplier + ema;
        return ema;
    }

    private static decimal CalculateStdDev(List<decimal> data)
    {
        var avg = data.Average();
        var sumSquares = data.Sum(d => (d - avg) * (d - avg));
        return (decimal)Math.Sqrt((double)(sumSquares / data.Count));
    }

    private static decimal CalculateAtr(List<OhlcBarDto> bars)
    {
        if (bars.Count == 0) return 0;
        return bars.Average(b => b.High - b.Low);
    }

    #endregion

    #region Mock Data Models

    private record MockQuote(string Symbol, decimal Price, decimal Change, decimal ChangePercent, decimal High, decimal Low, decimal Open, long Volume);
    private record MockBar(string Date, decimal Open, decimal High, decimal Low, decimal Close, long Volume);
    private record MockMover(string Symbol, string Name, decimal Price, decimal ChangePercent);
    private record MockMoversData(List<MockMover>? Gainers, List<MockMover>? Losers);

    #endregion
}
