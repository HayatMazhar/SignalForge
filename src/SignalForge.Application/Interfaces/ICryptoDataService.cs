using SignalForge.Application.DTOs;
namespace SignalForge.Application.Interfaces;

public interface ICryptoDataService
{
    Task<StockQuoteDto?> GetQuote(string symbol, CancellationToken cancellationToken = default);
    Task<List<OhlcBarDto>> GetHistory(string symbol, DateTime from, DateTime to, CancellationToken cancellationToken = default);
    Task<TechnicalDataDto?> GetTechnicalIndicators(string symbol, CancellationToken cancellationToken = default);
    Task<List<StockDto>> SearchCrypto(string query, CancellationToken cancellationToken = default);
    Task<List<TopMoverDto>> GetTopMovers(CancellationToken cancellationToken = default);
    Task<List<TopMoverDto>> GetTopLosers(CancellationToken cancellationToken = default);
}
