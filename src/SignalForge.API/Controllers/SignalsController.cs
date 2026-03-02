using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SignalForge.API.Middleware;
using SignalForge.Application.Commands.Signals;
using SignalForge.Application.Queries.Signals;
using SignalForge.Domain.Enums;
using System.Security.Claims;

namespace SignalForge.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SignalsController : ControllerBase
{
    private readonly IMediator _mediator;

    public SignalsController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<IActionResult> GetSignals([FromQuery] SignalType? type, [FromQuery] int limit = 50, CancellationToken ct = default)
    {
        var signals = await _mediator.Send(new GetSignalsQuery(type, limit), ct);
        return Ok(signals);
    }

    [HttpPost("generate")]
    public async Task<IActionResult> GenerateSignal([FromBody] GenerateSignalCommand command, CancellationToken ct)
    {
        var tier = User.FindFirstValue("tier") ?? "free";
        var limits = TierLimits.GetConfig(tier);
        if (!limits.CanGenerateSignals)
            return BadRequest(new { error = "Signal generation requires a Pro or Elite subscription." });

        var signal = await _mediator.Send(command, ct);
        return Ok(signal);
    }

    [HttpGet("watchlist")]
    public async Task<IActionResult> GetWatchlistSignals(CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var signals = await _mediator.Send(new GetWatchlistSignalsQuery(userId), ct);
        return Ok(signals);
    }
}
