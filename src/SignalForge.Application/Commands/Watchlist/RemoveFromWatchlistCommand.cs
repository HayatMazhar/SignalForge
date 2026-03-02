using MediatR;
using Microsoft.EntityFrameworkCore;
using SignalForge.Application.Interfaces;
namespace SignalForge.Application.Commands.Watchlist;

public record RemoveFromWatchlistCommand(string UserId, string Symbol) : IRequest<bool>;

public class RemoveFromWatchlistCommandHandler : IRequestHandler<RemoveFromWatchlistCommand, bool>
{
    private readonly IApplicationDbContext _db;
    public RemoveFromWatchlistCommandHandler(IApplicationDbContext db) { _db = db; }
    public async Task<bool> Handle(RemoveFromWatchlistCommand request, CancellationToken cancellationToken)
    {
        var item = await _db.UserWatchlists.FirstOrDefaultAsync(w => w.UserId == request.UserId && w.Symbol == request.Symbol, cancellationToken);
        if (item is null) return false;
        _db.UserWatchlists.Remove(item);
        await _db.SaveChangesAsync(cancellationToken);
        return true;
    }
}
