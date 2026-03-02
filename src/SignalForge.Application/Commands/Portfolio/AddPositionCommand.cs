using MediatR;
using SignalForge.Application.DTOs;
using SignalForge.Application.Interfaces;
using SignalForge.Domain.Entities;
namespace SignalForge.Application.Commands.Portfolio;

public record AddPositionCommand(string UserId, AddPositionDto Position) : IRequest<PortfolioPositionDto>;

public class AddPositionCommandHandler : IRequestHandler<AddPositionCommand, PortfolioPositionDto>
{
    private readonly IApplicationDbContext _db;
    public AddPositionCommandHandler(IApplicationDbContext db) { _db = db; }
    public async Task<PortfolioPositionDto> Handle(AddPositionCommand request, CancellationToken cancellationToken)
    {
        var position = new Domain.Entities.Portfolio
        {
            UserId = request.UserId,
            Symbol = request.Position.Symbol.ToUpperInvariant(),
            Quantity = request.Position.Quantity,
            AverageCost = request.Position.AverageCost
        };
        _db.Portfolios.Add(position);
        await _db.SaveChangesAsync(cancellationToken);
        return new PortfolioPositionDto(position.Id, position.Symbol, position.Quantity, position.AverageCost, position.AddedAt);
    }
}
