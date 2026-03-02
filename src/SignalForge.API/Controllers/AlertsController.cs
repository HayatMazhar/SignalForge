using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SignalForge.API.Middleware;
using SignalForge.Application.Commands.Alerts;
using SignalForge.Application.DTOs;
using SignalForge.Application.Interfaces;
using System.Security.Claims;

namespace SignalForge.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AlertsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IApplicationDbContext _db;

    public AlertsController(IMediator mediator, IApplicationDbContext db)
    {
        _mediator = mediator;
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var alerts = await _db.Alerts
            .Where(a => a.UserId == userId)
            .Select(a => new AlertDto(a.Id, a.Symbol, a.AlertType, a.TargetValue, a.IsActive, a.CreatedAt))
            .ToListAsync(ct);
        return Ok(alerts);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAlertDto dto, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var tier = User.FindFirstValue("tier") ?? "free";
        var limits = TierLimits.GetConfig(tier);

        var currentCount = await _db.Alerts.CountAsync(a => a.UserId == userId && a.IsActive, ct);
        if (currentCount >= limits.MaxAlerts)
            return BadRequest(new { error = $"Alert limit reached ({limits.MaxAlerts}). Upgrade your plan for more." });

        var result = await _mediator.Send(new CreateAlertCommand(userId, dto), ct);
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var result = await _mediator.Send(new DeleteAlertCommand(userId, id), ct);
        return result ? NoContent() : NotFound();
    }
}
