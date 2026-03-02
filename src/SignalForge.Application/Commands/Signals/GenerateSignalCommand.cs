using MediatR;
using Microsoft.EntityFrameworkCore;
using SignalForge.Application.DTOs;
using SignalForge.Application.Interfaces;
using SignalForge.Domain.Entities;
using SignalForge.Domain.Enums;
namespace SignalForge.Application.Commands.Signals;

public record GenerateSignalCommand(string Symbol) : IRequest<SignalDto>;

public class GenerateSignalCommandHandler : IRequestHandler<GenerateSignalCommand, SignalDto>
{
    private readonly IMarketDataService _marketData;
    private readonly INewsService _newsService;
    private readonly IOptionsFlowService _optionsFlow;
    private readonly IAISignalService _aiService;
    private readonly IApplicationDbContext _db;

    public GenerateSignalCommandHandler(IMarketDataService marketData, INewsService newsService, IOptionsFlowService optionsFlow, IAISignalService aiService, IApplicationDbContext db)
    {
        _marketData = marketData; _newsService = newsService; _optionsFlow = optionsFlow; _aiService = aiService; _db = db;
    }

    public async Task<SignalDto> Handle(GenerateSignalCommand request, CancellationToken cancellationToken)
    {
        var technicals = await _marketData.GetTechnicalIndicators(request.Symbol, cancellationToken);
        var news = await _newsService.GetNews(request.Symbol, 10, cancellationToken);
        var options = await _optionsFlow.GetSymbolFlow(request.Symbol, cancellationToken);

        var sentiment = await _aiService.AnalyzeSentiment(news.Select(n => n.Title).ToList(), cancellationToken);
        var reasoning = await _aiService.GenerateSignalReasoning(request.Symbol, technicals!, sentiment, options, cancellationToken);

        var technicalScore = technicals is not null ? CalculateTechnicalScore(technicals) : 50m;
        var sentimentScore = NormalizeScore(sentiment.Score);
        var optionsScore = CalculateOptionsScore(options);
        var confidenceScore = (technicalScore * 0.4m + sentimentScore * 0.3m + optionsScore * 0.3m);

        var signalType = confidenceScore >= 65 ? SignalType.Buy : confidenceScore <= 35 ? SignalType.Sell : SignalType.Hold;

        var signal = new Signal
        {
            Symbol = request.Symbol,
            Type = signalType,
            ConfidenceScore = Math.Round(confidenceScore, 2),
            Reasoning = reasoning,
            TechnicalScore = Math.Round(technicalScore, 2),
            SentimentScore = Math.Round(sentimentScore, 2),
            OptionsScore = Math.Round(optionsScore, 2),
            GeneratedAt = DateTime.UtcNow
        };

        _db.Signals.Add(signal);
        await _db.SaveChangesAsync(cancellationToken);

        return new SignalDto(signal.Id, signal.Symbol, signal.Type, signal.ConfidenceScore, signal.Reasoning, signal.TechnicalScore, signal.SentimentScore, signal.OptionsScore, signal.GeneratedAt);
    }

    private static decimal CalculateTechnicalScore(TechnicalDataDto data)
    {
        decimal score = 50;
        if (data.Rsi < 30) score += 15;
        else if (data.Rsi > 70) score -= 15;
        if (data.Macd > data.MacdSignal) score += 10;
        else score -= 10;
        if (data.Trend == "Bullish") score += 10;
        else if (data.Trend == "Bearish") score -= 10;
        return Math.Clamp(score, 0, 100);
    }

    private static decimal NormalizeScore(decimal sentiment) => Math.Clamp((sentiment + 1) * 50, 0, 100);

    private static decimal CalculateOptionsScore(List<OptionsFlowDto> flows)
    {
        if (flows.Count == 0) return 50;
        var callVolume = flows.Where(f => f.Type == OptionType.Call).Sum(f => f.Volume);
        var putVolume = flows.Where(f => f.Type == OptionType.Put).Sum(f => f.Volume);
        var total = callVolume + putVolume;
        if (total == 0) return 50;
        return Math.Clamp((decimal)callVolume / total * 100, 0, 100);
    }
}
