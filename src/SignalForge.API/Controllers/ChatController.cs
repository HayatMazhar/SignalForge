using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SignalForge.Application.DTOs;
using SignalForge.Application.Interfaces;

namespace SignalForge.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ChatController : ControllerBase
{
    private readonly IAISignalService _ai;
    private readonly IMarketDataService _marketData;
    private readonly INewsService _news;

    public ChatController(IAISignalService ai, IMarketDataService marketData, INewsService news)
    {
        _ai = ai;
        _marketData = marketData;
        _news = news;
    }

    [HttpPost]
    public async Task<IActionResult> Chat([FromBody] ChatRequestDto request, CancellationToken ct)
    {
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
