using MediatR;
using SignalForge.Application.DTOs;
using SignalForge.Application.Interfaces;
namespace SignalForge.Application.Queries.Stocks;

public record GetTopMoversQuery() : IRequest<List<TopMoverDto>>;

public class GetTopMoversQueryHandler : IRequestHandler<GetTopMoversQuery, List<TopMoverDto>>
{
    private readonly IMarketDataService _marketData;
    private readonly ICacheService _cache;
    public GetTopMoversQueryHandler(IMarketDataService marketData, ICacheService cache) { _marketData = marketData; _cache = cache; }
    public async Task<List<TopMoverDto>> Handle(GetTopMoversQuery request, CancellationToken cancellationToken)
    {
        var cached = await _cache.GetAsync<List<TopMoverDto>>("top-movers", cancellationToken);
        if (cached is not null) return cached;
        var result = await _marketData.GetTopMovers(cancellationToken);
        await _cache.SetAsync("top-movers", result, TimeSpan.FromMinutes(2), cancellationToken);
        return result;
    }
}
