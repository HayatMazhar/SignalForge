using MediatR;
using Microsoft.EntityFrameworkCore;
using SignalForge.Application.DTOs;
using SignalForge.Application.Interfaces;
using SignalForge.Domain.Entities;
namespace SignalForge.Application.Commands.Watchlist;

public record AddToWatchlistCommand(string UserId, string Symbol) : IRequest<WatchlistItemDto>;

public class AddToWatchlistCommandHandler : IRequestHandler<AddToWatchlistCommand, WatchlistItemDto>
{
    private readonly IApplicationDbContext _db;
    public AddToWatchlistCommandHandler(IApplicationDbContext db) { _db = db; }
    public async Task<WatchlistItemDto> Handle(AddToWatchlistCommand request, CancellationToken cancellationToken)
    {
        var exists = await _db.UserWatchlists.AnyAsync(w => w.UserId == request.UserId && w.Symbol == request.Symbol, cancellationToken);
        if (exists) throw new InvalidOperationException("Symbol already in watchlist");
        var item = new UserWatchlist { UserId = request.UserId, Symbol = request.Symbol.ToUpperInvariant() };
        _db.UserWatchlists.Add(item);
        await _db.SaveChangesAsync(cancellationToken);
        return new WatchlistItemDto(item.Symbol, item.AddedAt);
    }
}
