using MediatR;
using SignalForge.Application.DTOs;
using SignalForge.Application.Interfaces;
namespace SignalForge.Application.Queries.News;

public record GetStockNewsQuery(string Symbol, int Limit = 10) : IRequest<List<NewsArticleDto>>;

public class GetStockNewsQueryHandler : IRequestHandler<GetStockNewsQuery, List<NewsArticleDto>>
{
    private readonly INewsService _newsService;
    private readonly ICacheService _cache;
    public GetStockNewsQueryHandler(INewsService newsService, ICacheService cache) { _newsService = newsService; _cache = cache; }
    public async Task<List<NewsArticleDto>> Handle(GetStockNewsQuery request, CancellationToken cancellationToken)
    {
        var cacheKey = $"news:{request.Symbol}";
        var cached = await _cache.GetAsync<List<NewsArticleDto>>(cacheKey, cancellationToken);
        if (cached is not null) return cached;
        var result = await _newsService.GetNews(request.Symbol, request.Limit, cancellationToken);
        await _cache.SetAsync(cacheKey, result, TimeSpan.FromMinutes(5), cancellationToken);
        return result;
    }
}
