using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SignalForge.API.Middleware;
using SignalForge.Application.Commands.Watchlist;
using SignalForge.Application.DTOs;
using SignalForge.Application.Interfaces;
using System.Security.Claims;

namespace SignalForge.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class WatchlistController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IApplicationDbContext _db;

    public WatchlistController(IMediator mediator, IApplicationDbContext db)
    {
        _mediator = mediator;
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var items = await _db.UserWatchlists
            .Where(w => w.UserId == userId)
            .Select(w => new WatchlistItemDto(w.Symbol, w.AddedAt))
            .ToListAsync(ct);
        return Ok(items);
    }

    [HttpPost]
    public async Task<IActionResult> Add([FromBody] AddToWatchlistRequest request, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var tier = User.FindFirstValue("tier") ?? "free";
        var limits = TierLimits.GetConfig(tier);

        var currentCount = await _db.UserWatchlists.CountAsync(w => w.UserId == userId, ct);
        if (currentCount >= limits.MaxWatchlist)
            return BadRequest(new { error = $"Watchlist limit reached ({limits.MaxWatchlist}). Upgrade your plan for more." });

        var result = await _mediator.Send(new AddToWatchlistCommand(userId, request.Symbol), ct);
        return Ok(result);
    }

    [HttpDelete("{symbol}")]
    public async Task<IActionResult> Remove(string symbol, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var result = await _mediator.Send(new RemoveFromWatchlistCommand(userId, symbol.ToUpperInvariant()), ct);
        return result ? NoContent() : NotFound();
    }
}

public record AddToWatchlistRequest(string Symbol);
