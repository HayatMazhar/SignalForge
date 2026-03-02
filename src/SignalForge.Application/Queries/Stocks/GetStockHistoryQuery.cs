using MediatR;
using SignalForge.Application.DTOs;
using SignalForge.Application.Interfaces;
namespace SignalForge.Application.Queries.Stocks;

public record GetStockHistoryQuery(string Symbol, DateTime From, DateTime To) : IRequest<List<OhlcBarDto>>;

public class GetStockHistoryQueryHandler : IRequestHandler<GetStockHistoryQuery, List<OhlcBarDto>>
{
    private readonly IMarketDataService _marketData;
    private readonly ICacheService _cache;
    public GetStockHistoryQueryHandler(IMarketDataService marketData, ICacheService cache) { _marketData = marketData; _cache = cache; }
    public async Task<List<OhlcBarDto>> Handle(GetStockHistoryQuery request, CancellationToken cancellationToken)
    {
        var cacheKey = $"history:{request.Symbol}:{request.From:yyyyMMdd}:{request.To:yyyyMMdd}";
        var cached = await _cache.GetAsync<List<OhlcBarDto>>(cacheKey, cancellationToken);
        if (cached is not null) return cached;
        var result = await _marketData.GetHistory(request.Symbol, request.From, request.To, cancellationToken);
        await _cache.SetAsync(cacheKey, result, TimeSpan.FromMinutes(5), cancellationToken);
        return result;
    }
}
