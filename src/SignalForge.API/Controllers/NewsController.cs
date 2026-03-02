using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SignalForge.Application.Interfaces;
using SignalForge.Application.Queries.News;

namespace SignalForge.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NewsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IAISignalService _aiService;

    public NewsController(IMediator mediator, IAISignalService aiService)
    {
        _mediator = mediator;
        _aiService = aiService;
    }

    [HttpGet("{symbol}")]
    public async Task<IActionResult> GetNews(string symbol, [FromQuery] int limit = 10, CancellationToken ct = default)
    {
        var news = await _mediator.Send(new GetStockNewsQuery(symbol.ToUpperInvariant(), limit), ct);
        return Ok(news);
    }

    [HttpGet("market")]
    public async Task<IActionResult> GetMarketNews([FromQuery] int limit = 20, CancellationToken ct = default)
    {
        var news = await _mediator.Send(new GetMarketNewsQuery(limit), ct);
        return Ok(news);
    }

    [HttpGet("{symbol}/sentiment")]
    public async Task<IActionResult> GetSentiment(string symbol, CancellationToken ct)
    {
        var news = await _mediator.Send(new GetStockNewsQuery(symbol.ToUpperInvariant(), 10), ct);
        if (news.Count == 0) return Ok(new { score = 0, label = "Neutral", articlesAnalyzed = 0 });

        var headlines = news.Select(n => n.Title).ToList();
        var sentiment = await _aiService.AnalyzeSentiment(headlines, ct);
        return Ok(sentiment);
    }
}
