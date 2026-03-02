using MediatR;
using Microsoft.EntityFrameworkCore;
using SignalForge.Application.Interfaces;
namespace SignalForge.Application.Commands.Portfolio;

public record RemovePositionCommand(string UserId, Guid PositionId) : IRequest<bool>;

public class RemovePositionCommandHandler : IRequestHandler<RemovePositionCommand, bool>
{
    private readonly IApplicationDbContext _db;
    public RemovePositionCommandHandler(IApplicationDbContext db) { _db = db; }
    public async Task<bool> Handle(RemovePositionCommand request, CancellationToken cancellationToken)
    {
        var pos = await _db.Portfolios.FirstOrDefaultAsync(p => p.Id == request.PositionId && p.UserId == request.UserId, cancellationToken);
        if (pos is null) return false;
        _db.Portfolios.Remove(pos);
        await _db.SaveChangesAsync(cancellationToken);
        return true;
    }
}
