using Azure;
using Azure.AI.TextAnalytics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SignalForge.Application.DTOs;

namespace SignalForge.Infrastructure.Services;

public sealed class AzureTextAnalyticsService
{
    private readonly TextAnalyticsClient? _client;
    private readonly ILogger<AzureTextAnalyticsService> _logger;

    public AzureTextAnalyticsService(IConfiguration config, ILogger<AzureTextAnalyticsService> logger)
    {
        _logger = logger;
        var endpoint = config["TextAnalytics:Endpoint"];
        var key = config["TextAnalytics:ApiKey"];
        if (!string.IsNullOrEmpty(endpoint) && !string.IsNullOrEmpty(key))
        {
            _client = new TextAnalyticsClient(new Uri(endpoint), new AzureKeyCredential(key));
        }
    }

    public bool IsAvailable => _client != null;

    public async Task<SentimentResultDto> AnalyzeSentimentAsync(List<string> headlines, CancellationToken ct = default)
    {
        if (_client == null || headlines.Count == 0)
            return new SentimentResultDto(0, "Neutral", headlines.Count);

        try
        {
            var results = await _client.AnalyzeSentimentBatchAsync(headlines, cancellationToken: ct);

            decimal totalScore = 0;
            int count = 0;
            foreach (var result in results.Value)
            {
                if (result.HasError) continue;
                var score = result.DocumentSentiment.Sentiment switch
                {
                    TextSentiment.Positive => (decimal)result.DocumentSentiment.ConfidenceScores.Positive,
                    TextSentiment.Negative => -(decimal)result.DocumentSentiment.ConfidenceScores.Negative,
                    _ => 0m
                };
                totalScore += score;
                count++;
            }

            var avgScore = count > 0 ? Math.Round(totalScore / count, 3) : 0;
            var label = avgScore > 0.1m ? "Bullish" : avgScore < -0.1m ? "Bearish" : "Neutral";

            return new SentimentResultDto(avgScore, label, headlines.Count);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Azure Text Analytics sentiment failed, will fallback to GPT");
            return new SentimentResultDto(0, "Neutral", headlines.Count);
        }
    }
}
