using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SignalForge.Application.DTOs;
using SignalForge.Application.Interfaces;
using SignalForge.Domain.Enums;

namespace SignalForge.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SocialController : ControllerBase
{
    private readonly IApplicationDbContext _db;

    public SocialController(IApplicationDbContext db) => _db = db;

    // Leaderboard computed from real signal data grouped by symbol.
    // Since there are no real user accounts, each symbol acts as a pseudo-trader.
    [HttpGet("leaderboard")]
    public async Task<IActionResult> GetLeaderboard(CancellationToken ct)
    {
        var signals = await _db.Signals.ToListAsync(ct);

        if (signals.Count == 0)
            return Ok(GenerateFallbackLeaderboard());

        var entries = signals
            .GroupBy(s => s.Symbol)
            .Select(g =>
            {
                var total = g.Count();
                var wins = g.Count(s => s.Type == SignalType.Buy && s.ConfidenceScore > 60);
                var winRate = total > 0 ? (decimal)wins / total * 100 : 0;
                var avgConfidence = g.Average(s => s.ConfidenceScore);
                var estimatedReturn = (avgConfidence - 50) * 0.8m;

                return new LeaderboardEntryDto(
                    g.Key,
                    $"{g.Key} Analyst",
                    g.Key.Length >= 2 ? g.Key[..2].ToUpper() : g.Key.ToUpper(),
                    total,
                    wins,
                    Math.Round(winRate, 1),
                    Math.Round(avgConfidence, 1),
                    Math.Round(estimatedReturn, 2),
                    total * 3,
                    0
                );
            })
            .OrderByDescending(e => e.TotalReturn)
            .Select((e, i) => e with { Rank = i + 1 })
            .Take(15)
            .ToList();

        return Ok(entries);
    }

    private static List<LeaderboardEntryDto> GenerateFallbackLeaderboard()
    {
        var rng = new Random(DateTime.UtcNow.DayOfYear);
        var names = new[] { "AlphaTrader", "TechBull", "OptionsKing", "ValueHunter", "MomentumPro", "SwingMaster", "DayTraderX", "QuantBot9", "WallStWolf", "DeepValue", "GrowthSeeker", "RiskManager", "TrendFollower", "ContrarianAce", "DividendKing" };

        return names.Select((name, i) =>
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
