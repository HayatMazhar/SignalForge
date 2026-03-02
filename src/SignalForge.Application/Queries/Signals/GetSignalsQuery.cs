using MediatR;
using Microsoft.EntityFrameworkCore;
using SignalForge.Application.DTOs;
using SignalForge.Application.Interfaces;
using SignalForge.Domain.Enums;
namespace SignalForge.Application.Queries.Signals;

public record GetSignalsQuery(SignalType? Type = null, int Limit = 50) : IRequest<List<SignalDto>>;

public class GetSignalsQueryHandler : IRequestHandler<GetSignalsQuery, List<SignalDto>>
{
    private readonly IApplicationDbContext _db;
    public GetSignalsQueryHandler(IApplicationDbContext db) { _db = db; }
    public async Task<List<SignalDto>> Handle(GetSignalsQuery request, CancellationToken cancellationToken)
    {
        var query = _db.Signals.AsQueryable();
        if (request.Type.HasValue) query = query.Where(s => s.Type == request.Type.Value);
        return await query.OrderByDescending(s => s.GeneratedAt)
            .Take(request.Limit)
            .Select(s => new SignalDto(s.Id, s.Symbol, s.Type, s.ConfidenceScore, s.Reasoning, s.TechnicalScore, s.SentimentScore, s.OptionsScore, s.GeneratedAt))
            .ToListAsync(cancellationToken);
    }
}
