using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SignalForge.Application.DTOs;
using SignalForge.Application.Interfaces;
using SignalForge.Infrastructure.Services;

namespace SignalForge.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ChatController : ControllerBase
{
    private readonly IAISignalService _ai;
    private readonly IMarketDataService _marketData;
    private readonly INewsService _news;
    private readonly AzureSearchService _search;
    private readonly ContentSafetyService _safety;

    public ChatController(IAISignalService ai, IMarketDataService marketData, INewsService news, AzureSearchService search, ContentSafetyService safety)
    {
        _ai = ai;
        _marketData = marketData;
        _news = news;
        _search = search;
        _safety = safety;
    }

    [HttpPost]
    public async Task<IActionResult> Chat([FromBody] ChatRequestDto request, CancellationToken ct)
    {
        if (_safety.IsAvailable)
        {
            var moderation = await _safety.AnalyzeTextAsync(request.Message, ct);
            if (moderation.IsBlocked)
                return Ok(new ChatResponseDto("I'm sorry, I can't respond to that type of message. Please keep the conversation focused on stock market analysis.", null, ["Analyze AAPL", "Show top movers", "What's the market sentiment?"]));
        }
        var symbol = request.Symbol?.ToUpperInvariant();
        var contextParts = new List<string>();
        var suggestions = new List<string>();

        if (!string.IsNullOrEmpty(symbol))
        {
            var quote = await _marketData.GetQuote(symbol, ct);
            var technicals = await _marketData.GetTechnicalIndicators(symbol, ct);
            var newsItems = await _news.GetNews(symbol, 5, ct);

            if (quote != null)
                contextParts.Add($"{symbol} current price: ${quote.Price}, change: {quote.ChangePercent}%, volume: {quote.Volume}");
            if (technicals != null)
                contextParts.Add($"Technicals — RSI: {technicals.Rsi:F1}, MACD: {technicals.Macd:F2}, Trend: {technicals.Trend}, SMA20: ${technicals.Sma20:F2}, SMA50: ${technicals.Sma50:F2}");
            if (newsItems.Count > 0)
                contextParts.Add($"Recent headlines: {string.Join("; ", newsItems.Take(3).Select(n => n.Title))}");

            suggestions.AddRange(["Generate AI Signal", "View Trade Thesis", "Check Options Flow"]);
        }
        else
        {
            suggestions.AddRange(["Analyze AAPL", "What's the market sentiment?", "Show top movers"]);
        }

        if (_search.IsAvailable)
        {
            try
            {
                var searchQuery = symbol != null ? $"{symbol} {request.Message}" : request.Message;
                var docs = await _search.SearchAsync(searchQuery, 3, ct);
                if (docs.Count > 0)
                {
                    contextParts.Add("Relevant knowledge base context:");
                    foreach (var doc in docs)
                        contextParts.Add($"[{doc.Category}] {doc.Title}: {doc.Content}");
                }
            }
            catch { }
        }

        var systemPrompt = $"""
            You are SignalForge AI, an expert stock market analyst assistant.
            Be concise (2-4 sentences). Use data when available. Give actionable insights.
            {(contextParts.Count > 0 ? $"Current market data:\n{string.Join("\n", contextParts)}" : "No specific stock selected.")}
            """;

        var messages = new List<(string Role, string Content)>();
        if (request.History != null)
        {
            foreach (var h in request.History.TakeLast(5))
                messages.Add((h.Role, h.Content));
        }
        messages.Add(("user", request.Message));

        var response = await _ai.ChatAsync(systemPrompt, messages, ct);

        return Ok(new ChatResponseDto(response, symbol, suggestions));
    }
}
