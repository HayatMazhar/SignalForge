using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SignalForge.Application.Interfaces;
using SignalForge.Application.Queries.Stocks;

namespace SignalForge.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class StocksController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IMarketDataService _marketData;

    public StocksController(IMediator mediator, IMarketDataService marketData)
    {
        _mediator = mediator;
        _marketData = marketData;
    }

    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] string q, CancellationToken ct)
    {
        var results = await _marketData.SearchStocks(q, ct);
        return Ok(results);
    }

    [HttpGet("{symbol}")]
    public async Task<IActionResult> GetStock(string symbol, CancellationToken ct)
    {
        var stock = await _mediator.Send(new GetStockQuery(symbol.ToUpperInvariant()), ct);
        return stock is null ? NotFound() : Ok(stock);
    }

    [HttpGet("{symbol}/quote")]
    public async Task<IActionResult> GetQuote(string symbol, CancellationToken ct)
    {
        var quote = await _marketData.GetQuote(symbol.ToUpperInvariant(), ct);
        return quote is null ? NotFound() : Ok(quote);
    }

    [HttpGet("{symbol}/history")]
    public async Task<IActionResult> GetHistory(string symbol, [FromQuery] DateTime from, [FromQuery] DateTime to, CancellationToken ct)
    {
        var history = await _mediator.Send(new GetStockHistoryQuery(symbol.ToUpperInvariant(), from, to), ct);
        return Ok(history);
    }

    [HttpGet("top-movers")]
    public async Task<IActionResult> TopMovers(CancellationToken ct)
    {
        var movers = await _mediator.Send(new GetTopMoversQuery(), ct);
        return Ok(movers);
    }

    [HttpGet("movers/losers")]
    public async Task<IActionResult> TopLosers(CancellationToken ct)
    {
        var movers = await _mediator.Send(new GetTopMoversQuery(), ct);
        var losers = movers.Where(m => m.ChangePercent < 0).OrderBy(m => m.ChangePercent).ToList();
        return Ok(losers);
    }

    [HttpGet("{symbol}/indicators")]
    public async Task<IActionResult> GetIndicators(string symbol, CancellationToken ct)
    {
        var indicators = await _marketData.GetTechnicalIndicators(symbol.ToUpperInvariant(), ct);
        return indicators is null ? NotFound() : Ok(indicators);
    }
}
