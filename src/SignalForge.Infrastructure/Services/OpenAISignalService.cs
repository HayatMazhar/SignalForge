using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using OpenAI;
using OpenAI.Chat;
using SignalForge.Application.DTOs;
using SignalForge.Application.Interfaces;

namespace SignalForge.Infrastructure.Services;

public class OpenAISignalService : IAISignalService
{
    private readonly ChatClient _chatClient;
    private readonly ILogger<OpenAISignalService> _logger;

    public OpenAISignalService(IConfiguration config, ILogger<OpenAISignalService> logger)
    {
        _logger = logger;
        var apiKey = config["Core42Ai:ApiKey"] ?? "";
        var endpoint = config["Core42Ai:ApiEndpoint"] ?? "https://api.core42.ai/v1/";
        var modelName = config["Core42Ai:ModelName"] ?? "gpt-4o";

        var credential = new System.ClientModel.ApiKeyCredential(apiKey);
        var options = new OpenAIClientOptions { Endpoint = new Uri(endpoint) };
        var client = new OpenAIClient(credential, options);
        _chatClient = client.GetChatClient(modelName);
    }

    public async Task<SentimentResultDto> AnalyzeSentiment(List<string> headlines, CancellationToken cancellationToken = default)
    {
        try
        {
            var prompt = $"""
                Analyze the sentiment of these stock news headlines and return a JSON object with:
                - "score": a decimal between -1.0 (very bearish) and 1.0 (very bullish)
                - "label": one of "Bullish", "Bearish", or "Neutral"

                Headlines:
                {string.Join("\n", headlines.Select((h, i) => $"{i + 1}. {h}"))}

                Return ONLY valid JSON, no markdown.
                """;

            var options = new ChatCompletionOptions { ResponseFormat = ChatResponseFormat.CreateJsonObjectFormat() };
            var result = await _chatClient.CompleteChatAsync([new UserChatMessage(prompt)], options, cancellationToken);

            var json = JsonSerializer.Deserialize<JsonElement>(result.Value.Content[0].Text);
            return new SentimentResultDto(
                json.GetProperty("score").GetDecimal(),
                json.GetProperty("label").GetString() ?? "Neutral",
                headlines.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Sentiment analysis failed");
            return new SentimentResultDto(0, "Neutral", headlines.Count);
        }
    }

    public async Task<string> GenerateSignalReasoning(string symbol, TechnicalDataDto technicals, SentimentResultDto sentiment, List<OptionsFlowDto> optionsFlow, CancellationToken cancellationToken = default)
    {
        try
        {
            var callVol = optionsFlow.Where(f => f.Type == Domain.Enums.OptionType.Call).Sum(f => f.Volume);
            var putVol = optionsFlow.Where(f => f.Type == Domain.Enums.OptionType.Put).Sum(f => f.Volume);

            var prompt = $"""
                You are a professional stock analyst. Generate a concise 2-3 sentence trading signal reasoning for {symbol}.

                Technical Data:
                - RSI: {technicals.Rsi}, MACD: {technicals.Macd}, Trend: {technicals.Trend}
                - SMA20: {technicals.Sma20}, SMA50: {technicals.Sma50}, SMA200: {technicals.Sma200}

                Sentiment: {sentiment.Label} (score: {sentiment.Score}, {sentiment.ArticlesAnalyzed} articles)

                Options Flow: {callVol} call volume vs {putVol} put volume, {optionsFlow.Count(f => f.IsUnusual)} unusual trades

                Focus on actionable insights. Be specific about key drivers.
                """;

            var result = await _chatClient.CompleteChatAsync([new UserChatMessage(prompt)], cancellationToken: cancellationToken);
            return result.Value.Content[0].Text;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Signal reasoning generation failed for {Symbol}", symbol);
            return $"Unable to generate AI reasoning for {symbol} at this time.";
        }
    }
}
