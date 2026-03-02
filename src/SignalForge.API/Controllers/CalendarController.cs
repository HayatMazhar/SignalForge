using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SignalForge.Infrastructure.Services;

namespace SignalForge.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CalendarController : ControllerBase
{
    private readonly ILogger<CalendarController> _logger;

    public CalendarController(ILogger<CalendarController> logger) => _logger = logger;

    [HttpGet("earnings")]
    public IActionResult GetEarnings([FromQuery] string? filter)
    {
        var data = MockDataProvider.LoadJson<List<object>>("earnings.json", _logger);
        return Ok(data ?? []);
    }

    [HttpGet("economic")]
    public IActionResult GetEconomicCalendar()
    {
        var data = MockDataProvider.LoadJson<List<object>>("economic_calendar.json", _logger);
        return Ok(data ?? []);
    }

    [HttpGet("insider-trades")]
    public IActionResult GetInsiderTrades()
    {
        var data = MockDataProvider.LoadJson<List<object>>("insider_trades.json", _logger);
        return Ok(data ?? []);
    }

    [HttpGet("dividends")]
    public IActionResult GetDividends()
    {
        var data = MockDataProvider.LoadJson<Dictionary<string, object>>("dividends.json", _logger);
        return Ok(data ?? new Dictionary<string, object>());
    }

    [HttpGet("dividends/{symbol}")]
    public IActionResult GetStockDividend(string symbol)
    {
        var data = MockDataProvider.LoadJson<Dictionary<string, object>>("dividends.json", _logger);
        if (data is null || !data.TryGetValue(symbol.ToUpperInvariant(), out var div)) return NotFound();
        return Ok(div);
    }

    [HttpGet("ipos")]
    public IActionResult GetIpos()
    {
        var data = MockDataProvider.LoadJson<List<object>>("ipos.json", _logger);
        return Ok(data ?? []);
    }
}
