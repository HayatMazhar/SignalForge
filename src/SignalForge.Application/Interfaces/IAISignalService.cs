using SignalForge.Application.DTOs;
namespace SignalForge.Application.Interfaces;

public interface IAISignalService
{
    Task<SentimentResultDto> AnalyzeSentiment(List<string> headlines, CancellationToken cancellationToken = default);
    Task<string> GenerateSignalReasoning(string symbol, TechnicalDataDto technicals, SentimentResultDto sentiment, List<OptionsFlowDto> optionsFlow, CancellationToken cancellationToken = default);
}
