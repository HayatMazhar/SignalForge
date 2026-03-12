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

    [HttpGet("data-source")]
    public IActionResult GetDataSource()
    {
        return Ok(new { isMockData = _marketData.IsMockMode, source = _marketData.IsMockMode ? "mock" : "polygon" });
    }

    [HttpGet("indices")]
    public async Task<IActionResult> GetIndices(CancellationToken ct)
    {
        var indexEtfs = new (string Symbol, string DisplayName)[]
        {
            ("SPY", "S&P 500"), ("QQQ", "NASDAQ"), ("DIA", "DOW"), ("VIXY", "VIX"),
        };

        var tasks = indexEtfs.Select(async etf =>
        {
            var quote = await _marketData.GetQuote(etf.Symbol, ct);
            return quote is null ? null : new
            {
                symbol = etf.Symbol,
                name = etf.DisplayName,
                price = quote.Price,
                change = quote.Change,
                changePercent = quote.ChangePercent,
                volume = quote.Volume,
            };
        });

        var results = (await Task.WhenAll(tasks)).Where(r => r is not null).ToList();
        return Ok(results);
    }

    [HttpGet("sectors")]
    public async Task<IActionResult> GetSectors(CancellationToken ct)
    {
        var sectorEtfs = new (string Symbol, string Sector)[]
        {
            ("XLK", "Tech"), ("XLV", "Health"), ("XLF", "Finance"),
            ("XLE", "Energy"), ("XLY", "Consumer"), ("XLI", "Industrial"),
            ("XLC", "Telecom"), ("XLRE", "Real Est"), ("XLB", "Materials"),
            ("XLU", "Utilities"),
        };

        var tasks = sectorEtfs.Select(async etf =>
        {
            var quote = await _marketData.GetQuote(etf.Symbol, ct);
            return quote is null ? null : new
            {
                symbol = etf.Symbol,
                sector = etf.Sector,
                price = quote.Price,
                changePercent = quote.ChangePercent,
            };
        });

        var results = (await Task.WhenAll(tasks)).Where(r => r is not null).ToList();
        return Ok(results);
    }

    [HttpGet("snapshot")]
    public async Task<IActionResult> GetSnapshot(CancellationToken ct)
    {
        var movers = await _mediator.Send(new GetTopMoversQuery(), ct);

        var results = movers.Select(m => new
        {
            symbol = m.Symbol,
            name = m.Name,
            price = m.Price,
            changePercent = m.ChangePercent,
        }).ToList();

        return Ok(results);
    }
}
