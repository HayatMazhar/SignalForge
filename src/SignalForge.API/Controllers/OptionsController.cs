using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SignalForge.API.Middleware;
using SignalForge.Application.Queries.Options;
using System.Security.Claims;

namespace SignalForge.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OptionsController : ControllerBase
{
    private readonly IMediator _mediator;

    public OptionsController(IMediator mediator) => _mediator = mediator;

    [HttpGet("unusual")]
    public async Task<IActionResult> GetUnusualFlow(CancellationToken ct)
    {
        var tier = User.FindFirstValue("tier") ?? "free";
        if (!TierLimits.GetConfig(tier).CanAccessOptionsFlow)
            return BadRequest(new { error = "Options flow data requires a Pro or Elite subscription." });

        var flow = await _mediator.Send(new GetUnusualFlowQuery(), ct);
        return Ok(flow);
    }

    [HttpGet("{symbol}")]
    public async Task<IActionResult> GetSymbolFlow(string symbol, CancellationToken ct)
    {
        var tier = User.FindFirstValue("tier") ?? "free";
        if (!TierLimits.GetConfig(tier).CanAccessOptionsFlow)
            return BadRequest(new { error = "Options flow data requires a Pro or Elite subscription." });

        var flow = await _mediator.Send(new GetSymbolFlowQuery(symbol.ToUpperInvariant()), ct);
        return Ok(flow);
    }
}
