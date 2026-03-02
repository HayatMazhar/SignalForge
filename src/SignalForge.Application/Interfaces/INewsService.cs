using SignalForge.Application.DTOs;
namespace SignalForge.Application.Interfaces;

public interface INewsService
{
    Task<List<NewsArticleDto>> GetNews(string symbol, int limit = 10, CancellationToken cancellationToken = default);
    Task<List<NewsArticleDto>> GetMarketNews(int limit = 20, CancellationToken cancellationToken = default);
}
