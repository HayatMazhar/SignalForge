using MediatR;
using SignalForge.Application.DTOs;
using SignalForge.Application.Interfaces;
namespace SignalForge.Application.Queries.News;

public record GetMarketNewsQuery(int Limit = 20) : IRequest<List<NewsArticleDto>>;

public class GetMarketNewsQueryHandler : IRequestHandler<GetMarketNewsQuery, List<NewsArticleDto>>
{
    private readonly INewsService _newsService;
    private readonly ICacheService _cache;
    public GetMarketNewsQueryHandler(INewsService newsService, ICacheService cache) { _newsService = newsService; _cache = cache; }
    public async Task<List<NewsArticleDto>> Handle(GetMarketNewsQuery request, CancellationToken cancellationToken)
    {
        var cached = await _cache.GetAsync<List<NewsArticleDto>>("market-news", cancellationToken);
        if (cached is not null) return cached;
        var result = await _newsService.GetMarketNews(request.Limit, cancellationToken);
        await _cache.SetAsync("market-news", result, TimeSpan.FromMinutes(5), cancellationToken);
        return result;
    }
}
