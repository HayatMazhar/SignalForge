using SignalForge.Application.DTOs;
namespace SignalForge.Application.Interfaces;

public interface IAISignalService
{
    Task<SentimentResultDto> AnalyzeSentiment(List<string> headlines, CancellationToken cancellationToken = default);
    Task<string> GenerateSignalReasoning(string symbol, TechnicalDataDto technicals, SentimentResultDto sentiment, List<OptionsFlowDto> optionsFlow, CancellationToken cancellationToken = default);
    Task<string> ChatAsync(string systemPrompt, List<(string Role, string Content)> messages, CancellationToken cancellationToken = default);
    Task<string> PredictPriceAsync(string symbol, decimal currentPrice, TechnicalDataDto technicals, decimal changePercent, long volume, CancellationToken cancellationToken = default);
    Task<string> OptimizePortfolioAsync(List<(string Symbol, decimal Quantity, decimal AvgCost, TechnicalDataDto? Tech)> positions, CancellationToken cancellationToken = default);
    Task<string> DetectAnomaliesAsync(string symbol, decimal price, decimal changePercent, long volume, TechnicalDataDto? technicals, CancellationToken cancellationToken = default);
    Task<string> NaturalQueryAsync(string query, string marketContext, CancellationToken cancellationToken = default);
    Task<string> GenerateThesisAsync(string symbol, decimal price, TechnicalDataDto? technicals, SentimentResultDto sentiment, long callVol, long putVol, int unusualCount, CancellationToken cancellationToken = default);
}
