using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SignalForge.Application.DTOs;
using SignalForge.Application.Interfaces;

namespace SignalForge.Infrastructure.Services;

public class NewsApiService : INewsService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<NewsApiService> _logger;
    private readonly string _apiKey;
    private readonly bool _useMockData;

    private Dictionary<string, List<MockNewsArticle>>? _newsCache;

    public NewsApiService(HttpClient httpClient, IConfiguration config, ILogger<NewsApiService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
        _apiKey = config["NewsApi:ApiKey"] ?? "";
        _useMockData = string.IsNullOrEmpty(_apiKey) || _apiKey.Contains("your-");
        if (!_useMockData)
        {
            _httpClient.BaseAddress = new Uri("https://newsapi.org/");
        }
    }

    public async Task<List<NewsArticleDto>> GetNews(string symbol, int limit = 10, CancellationToken cancellationToken = default)
    {
        if (_useMockData) return GetMockNews(symbol, limit);
        try
        {
            var response = await _httpClient.GetAsync(
                $"v2/everything?q={symbol}+stock&sortBy=publishedAt&pageSize={limit}&apiKey={_apiKey}", cancellationToken);
            if (!response.IsSuccessStatusCode) return GetMockNews(symbol, limit);
            var json = await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken);
            if (!json.TryGetProperty("articles", out var articles)) return GetMockNews(symbol, limit);
            return articles.EnumerateArray().Select(a => new NewsArticleDto(
                Guid.NewGuid(), symbol,
                a.GetProperty("title").GetString() ?? "",
                a.GetProperty("url").GetString() ?? "",
                a.TryGetProperty("source", out var src) ? src.GetProperty("name").GetString() ?? "" : "",
                a.TryGetProperty("publishedAt", out var pub) ? DateTime.Parse(pub.GetString() ?? DateTime.UtcNow.ToString()) : DateTime.UtcNow,
                0,
                a.TryGetProperty("description", out var desc) ? desc.GetString() ?? "" : ""
            )).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "API failed for news {Symbol}, falling back to mock data", symbol);
            return GetMockNews(symbol, limit);
        }
    }

    public async Task<List<NewsArticleDto>> GetMarketNews(int limit = 20, CancellationToken cancellationToken = default)
    {
        if (_useMockData) return GetMockMarketNews(limit);
        try
        {
            var response = await _httpClient.GetAsync(
                $"v2/top-headlines?category=business&country=us&pageSize={limit}&apiKey={_apiKey}", cancellationToken);
            if (!response.IsSuccessStatusCode) return GetMockMarketNews(limit);
            var json = await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken);
            if (!json.TryGetProperty("articles", out var articles)) return GetMockMarketNews(limit);
            return articles.EnumerateArray().Select(a => new NewsArticleDto(
                Guid.NewGuid(), "MARKET",
                a.GetProperty("title").GetString() ?? "",
                a.GetProperty("url").GetString() ?? "",
                a.TryGetProperty("source", out var src) ? src.GetProperty("name").GetString() ?? "" : "",
                a.TryGetProperty("publishedAt", out var pub) ? DateTime.Parse(pub.GetString() ?? DateTime.UtcNow.ToString()) : DateTime.UtcNow,
                0,
                a.TryGetProperty("description", out var desc) ? desc.GetString() ?? "" : ""
            )).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "API failed for market news, falling back to mock data");
            return GetMockMarketNews(limit);
        }
    }

    #region Mock Data

    private void EnsureNewsLoaded()
    {
        _newsCache ??= MockDataProvider.LoadJson<Dictionary<string, List<MockNewsArticle>>>("news.json", _logger);
    }

    private List<NewsArticleDto> GetMockNews(string symbol, int limit)
    {
        EnsureNewsLoaded();
        var upper = symbol.ToUpperInvariant();
        if (_newsCache is null || !_newsCache.TryGetValue(upper, out var articles))
            return [];
        return articles.Take(limit).Select(a => new NewsArticleDto(
            Guid.NewGuid(), upper, a.Title, a.Url, a.Source,
            DateTime.TryParse(a.PublishedAt, out var dt) ? dt : DateTime.UtcNow,
            a.SentimentScore, a.Summary
        )).ToList();
    }

    private List<NewsArticleDto> GetMockMarketNews(int limit)
    {
        EnsureNewsLoaded();
        var allNews = new List<NewsArticleDto>();

        if (_newsCache is not null && _newsCache.TryGetValue("MARKET", out var marketArticles))
        {
            allNews.AddRange(marketArticles.Select(a => new NewsArticleDto(
                Guid.NewGuid(), "MARKET", a.Title, a.Url, a.Source,
                DateTime.TryParse(a.PublishedAt, out var dt) ? dt : DateTime.UtcNow,
                a.SentimentScore, a.Summary
            )));
        }

        if (_newsCache is not null)
        {
            foreach (var (sym, articles) in _newsCache)
            {
                if (sym == "MARKET") continue;
                allNews.AddRange(articles.Take(2).Select(a => new NewsArticleDto(
                    Guid.NewGuid(), sym, a.Title, a.Url, a.Source,
                    DateTime.TryParse(a.PublishedAt, out var dt) ? dt : DateTime.UtcNow,
                    a.SentimentScore, a.Summary
                )));
            }
        }

        return allNews.OrderByDescending(n => n.PublishedAt).Take(limit).ToList();
    }

    private record MockNewsArticle(string Title, string Url, string Source, string PublishedAt, decimal SentimentScore, string Summary);

    #endregion
}
