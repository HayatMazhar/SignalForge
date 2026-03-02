using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SignalForge.Application.Commands.Portfolio;
using SignalForge.Application.DTOs;
using SignalForge.Application.Interfaces;
using System.Security.Claims;

namespace SignalForge.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PortfolioController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IApplicationDbContext _db;

    public PortfolioController(IMediator mediator, IApplicationDbContext db)
    {
        _mediator = mediator;
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var positions = await _db.Portfolios
            .Where(p => p.UserId == userId)
            .Select(p => new PortfolioPositionDto(p.Id, p.Symbol, p.Quantity, p.AverageCost, p.AddedAt))
            .ToListAsync(ct);
        return Ok(positions);
    }

    [HttpPost]
    public async Task<IActionResult> AddPosition([FromBody] AddPositionDto dto, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var result = await _mediator.Send(new AddPositionCommand(userId, dto), ct);
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> RemovePosition(Guid id, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var result = await _mediator.Send(new RemovePositionCommand(userId, id), ct);
        return result ? NoContent() : NotFound();
    }
}
