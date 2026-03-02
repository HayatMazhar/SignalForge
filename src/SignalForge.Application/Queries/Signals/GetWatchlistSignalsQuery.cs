using MediatR;
using Microsoft.EntityFrameworkCore;
using SignalForge.Application.DTOs;
using SignalForge.Application.Interfaces;
namespace SignalForge.Application.Queries.Signals;

public record GetWatchlistSignalsQuery(string UserId) : IRequest<List<SignalDto>>;

public class GetWatchlistSignalsQueryHandler : IRequestHandler<GetWatchlistSignalsQuery, List<SignalDto>>
{
    private readonly IApplicationDbContext _db;
    public GetWatchlistSignalsQueryHandler(IApplicationDbContext db) { _db = db; }
    public async Task<List<SignalDto>> Handle(GetWatchlistSignalsQuery request, CancellationToken cancellationToken)
    {
        var watchlistSymbols = await _db.UserWatchlists
            .Where(w => w.UserId == request.UserId)
            .Select(w => w.Symbol)
            .ToListAsync(cancellationToken);

        return await _db.Signals
            .Where(s => watchlistSymbols.Contains(s.Symbol))
            .OrderByDescending(s => s.GeneratedAt)
            .Take(50)
            .Select(s => new SignalDto(s.Id, s.Symbol, s.Type, s.ConfidenceScore, s.Reasoning, s.TechnicalScore, s.SentimentScore, s.OptionsScore, s.GeneratedAt))
            .ToListAsync(cancellationToken);
    }
}
