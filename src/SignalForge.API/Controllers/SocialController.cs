using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SignalForge.Application.DTOs;
using SignalForge.Application.Interfaces;

namespace SignalForge.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SocialController : ControllerBase
{
    [HttpGet("leaderboard")]
    public IActionResult GetLeaderboard()
    {
        var rng = new Random(DateTime.UtcNow.DayOfYear);
        var names = new[] { "AlphaTrader", "TechBull", "OptionsKing", "ValueHunter", "MomentumPro", "SwingMaster", "DayTraderX", "QuantBot9", "WallStWolf", "DeepValue", "GrowthSeeker", "RiskManager", "TrendFollower", "ContrarianAce", "DividendKing" };

        var entries = names.Select((name, i) =>
        {
            var totalSignals = 50 + rng.Next(200);
            var winRate = 45 + rng.Next(35);
            var winningSignals = (int)(totalSignals * winRate / 100.0);
            return new LeaderboardEntryDto(
                Guid.NewGuid().ToString(), name, name[..2].ToUpper(),
                totalSignals, winningSignals, winRate,
                55 + rng.Next(30), -10 + rng.Next(80), rng.Next(5, 500), i + 1
            );
        }).OrderByDescending(e => e.TotalReturn).Select((e, i) => e with { Rank = i + 1 }).ToList();

        return Ok(entries);
    }
}

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CompareController : ControllerBase
{
    private readonly IMarketDataService _marketData;

    public CompareController(IMarketDataService marketData) => _marketData = marketData;

    [HttpGet]
    public async Task<IActionResult> CompareStocks([FromQuery] string symbols, CancellationToken ct)
    {
        var symbolList = symbols.Split(',').Select(s => s.Trim().ToUpperInvariant()).Where(s => s.Length > 0).Take(5).ToList();
        var results = new List<ComparisonDto>();

        foreach (var sym in symbolList)
        {
            var quote = await _marketData.GetQuote(sym, ct);
            var tech = await _marketData.GetTechnicalIndicators(sym, ct);
            if (quote == null) continue;

            results.Add(new ComparisonDto(
                sym, quote.Price, quote.ChangePercent,
                tech?.Rsi ?? 50, tech?.Trend ?? "Neutral", 0,
                0, 0, ""
            ));
        }

        return Ok(results);
    }
}
