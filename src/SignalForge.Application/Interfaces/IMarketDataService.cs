using SignalForge.Application.DTOs;
namespace SignalForge.Application.Interfaces;

public interface IMarketDataService
{
    Task<StockQuoteDto?> GetQuote(string symbol, CancellationToken cancellationToken = default);
    Task<List<OhlcBarDto>> GetHistory(string symbol, DateTime from, DateTime to, CancellationToken cancellationToken = default);
    Task<TechnicalDataDto?> GetTechnicalIndicators(string symbol, CancellationToken cancellationToken = default);
    Task<List<StockDto>> SearchStocks(string query, CancellationToken cancellationToken = default);
    Task<List<TopMoverDto>> GetTopMovers(CancellationToken cancellationToken = default);
}
