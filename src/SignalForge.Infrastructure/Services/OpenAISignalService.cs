using System.Text.Json;
using Microsoft.Extensions.Logging;
using SignalForge.Application.DTOs;
using SignalForge.Application.Interfaces;

namespace SignalForge.Infrastructure.Services;

public class OpenAISignalService : IAISignalService
{
    private readonly Core42ChatClient _chat;
    private readonly AzureTextAnalyticsService _textAnalytics;
    private readonly ILogger<OpenAISignalService> _logger;

    public OpenAISignalService(Core42ChatClient chat, AzureTextAnalyticsService textAnalytics, ILogger<OpenAISignalService> logger)
    {
        _chat = chat;
        _textAnalytics = textAnalytics;
        _logger = logger;
    }

    public async Task<SentimentResultDto> AnalyzeSentiment(List<string> headlines, CancellationToken cancellationToken = default)
    {
        if (_textAnalytics.IsAvailable)
        {
            var result = await _textAnalytics.AnalyzeSentimentAsync(headlines, cancellationToken);
            if (result.Label != "Neutral" || result.Score != 0)
                return result;
        }

        try
        {
            var headlineList = string.Join("\n", headlines.Select((h, i) => $"{i + 1}. {h}"));
            var prompt = "Analyze the sentiment of these stock news headlines and return a JSON object with:\n"
                + "- \"score\": a decimal between -1.0 (very bearish) and 1.0 (very bullish)\n"
                + "- \"label\": one of \"Bullish\", \"Bearish\", or \"Neutral\"\n\n"
                + "Headlines:\n" + headlineList + "\n\nReturn ONLY valid JSON, no markdown.";

            var text = await _chat.CompleteAsync(
                [("user", prompt)], jsonResponse: true, cancellationToken: cancellationToken);

            var json = JsonSerializer.Deserialize<JsonElement>(text);
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

            var prompt = $"You are a professional stock analyst. Generate a concise 2-3 sentence trading signal reasoning for {symbol}.\n\n"
                + $"Technical Data:\n- RSI: {technicals.Rsi}, MACD: {technicals.Macd}, Trend: {technicals.Trend}\n"
                + $"- SMA20: {technicals.Sma20}, SMA50: {technicals.Sma50}, SMA200: {technicals.Sma200}\n\n"
                + $"Sentiment: {sentiment.Label} (score: {sentiment.Score}, {sentiment.ArticlesAnalyzed} articles)\n\n"
                + $"Options Flow: {callVol} call volume vs {putVol} put volume, {optionsFlow.Count(f => f.IsUnusual)} unusual trades\n\n"
                + "Focus on actionable insights. Be specific about key drivers.";

            return await _chat.CompleteAsync([("user", prompt)], jsonResponse: false, cancellationToken: cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Signal reasoning generation failed for {Symbol}", symbol);
            return $"Unable to generate AI reasoning for {symbol} at this time.";
        }
    }

    public async Task<string> ChatAsync(string systemPrompt, List<(string Role, string Content)> messages, CancellationToken cancellationToken = default)
    {
        try
        {
            var all = new List<(string Role, string Content)> { ("system", systemPrompt) };
            foreach (var m in messages)
                all.Add((m.Role, m.Content));

            return await _chat.CompleteAsync(all, jsonResponse: false, maxTokensOverride: 1024, cancellationToken: cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Chat completion failed");
            return "I'm experiencing connectivity issues. Please try again in a moment.";
        }
    }

    public async Task<string> PredictPriceAsync(string symbol, decimal currentPrice, TechnicalDataDto technicals, decimal changePercent, long volume, CancellationToken cancellationToken = default)
    {
        try
        {
            var prompt = $"You are a quantitative stock analyst. Analyze {symbol} and provide price predictions.\n\n"
                + $"Current Data:\n"
                + $"- Price: ${currentPrice}, Day Change: {changePercent:F2}%, Volume: {volume:N0}\n"
                + $"- RSI: {technicals.Rsi:F1}, MACD: {technicals.Macd:F2}, Trend: {technicals.Trend}\n"
                + $"- SMA20: ${technicals.Sma20:F2}, SMA50: ${technicals.Sma50:F2}, SMA200: ${technicals.Sma200:F2}\n"
                + $"- Bollinger Upper: ${technicals.BollingerUpper:F2}, Lower: ${technicals.BollingerLower:F2}\n"
                + $"- ATR: {technicals.Atr:F2}\n\n"
                + "Return a JSON object with exactly this structure:\n"
                + "{\n"
                + "  \"predictions\": [\n"
                + "    { \"horizon\": \"7 Days\", \"price\": <number>, \"change\": <percent>, \"confidence\": <0-100>, \"direction\": \"Bullish|Bearish\" },\n"
                + "    { \"horizon\": \"30 Days\", \"price\": <number>, \"change\": <percent>, \"confidence\": <0-100>, \"direction\": \"Bullish|Bearish\" },\n"
                + "    { \"horizon\": \"90 Days\", \"price\": <number>, \"change\": <percent>, \"confidence\": <0-100>, \"direction\": \"Bullish|Bearish\" }\n"
                + "  ],\n"
                + "  \"factors\": [\n"
                + "    { \"name\": \"<factor name>\", \"impact\": \"<Positive|Negative|Neutral>\", \"weight\": <0-100> }\n"
                + "  ],\n"
                + "  \"summary\": \"<2-3 sentence analysis>\"\n"
                + "}\n\n"
                + "Base predictions on technical analysis. Be realistic with confidence scores.\n"
                + "Return ONLY valid JSON, no markdown.";

            return await _chat.CompleteAsync([("user", prompt)], jsonResponse: true, cancellationToken: cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Price prediction failed for {Symbol}", symbol);
            return FallbackPrediction(symbol, currentPrice, technicals);
        }
    }

    public async Task<string> OptimizePortfolioAsync(List<(string Symbol, decimal Quantity, decimal AvgCost, TechnicalDataDto? Tech)> positions, CancellationToken cancellationToken = default)
    {
        try
        {
            var totalValue = positions.Sum(p => p.Quantity * p.AvgCost);
            var positionsText = string.Join("\n", positions.Select(p =>
            {
                var weight = totalValue > 0 ? p.Quantity * p.AvgCost / totalValue * 100 : 0;
                var rsi = p.Tech?.Rsi ?? 50;
                var trend = p.Tech?.Trend ?? "Neutral";
                return $"  - {p.Symbol}: {p.Quantity} shares @ ${p.AvgCost:F2} (weight: {weight:F1}%, RSI: {rsi:F0}, Trend: {trend})";
            }));

            var prompt = $"You are a professional portfolio manager. Analyze and optimize this portfolio.\n\n"
                + $"Portfolio (Total Value: ${totalValue:F2}):\n{positionsText}\n\n"
                + "Return a JSON object with exactly this structure:\n"
                + "{\n"
                + "  \"suggestions\": [\n"
                + "    {\n"
                + "      \"symbol\": \"<ticker>\",\n"
                + "      \"currentWeight\": <number>,\n"
                + "      \"targetWeight\": <number>,\n"
                + "      \"action\": \"Hold|Add|Reduce|Take Profits|Sell\",\n"
                + "      \"reason\": \"<1-2 sentence reasoning>\",\n"
                + "      \"rsi\": <number>,\n"
                + "      \"trend\": \"<Bullish|Bearish|Neutral>\"\n"
                + "    }\n"
                + "  ],\n"
                + "  \"summary\": {\n"
                + $"    \"totalPositions\": {positions.Count},\n"
                + $"    \"totalValue\": {totalValue:F2},\n"
                + "    \"diversificationScore\": <0-100>,\n"
                + "    \"concentrationRisk\": \"Low|Medium|High\",\n"
                + "    \"overallHealth\": \"Excellent|Good|Needs Attention\"\n"
                + "  }\n"
                + "}\n\n"
                + "Consider diversification, concentration risk, technical signals, and risk management.\n"
                + "Return ONLY valid JSON, no markdown.";

            return await _chat.CompleteAsync([("user", prompt)], jsonResponse: true, cancellationToken: cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Portfolio optimization failed");
            return FallbackOptimization(positions);
        }
    }

    public async Task<string> DetectAnomaliesAsync(string symbol, decimal price, decimal changePercent, long volume, TechnicalDataDto? technicals, CancellationToken cancellationToken = default)
    {
        try
        {
            var prompt = $"You are a market surveillance analyst. Detect trading anomalies for {symbol}.\n\n"
                + $"Current Data:\n"
                + $"- Price: ${price:F2}, Day Change: {changePercent:F2}%\n"
                + $"- Volume: {volume:N0}\n"
                + $"- RSI: {technicals?.Rsi ?? 50:F1}, MACD: {technicals?.Macd ?? 0:F2}\n"
                + $"- Trend: {technicals?.Trend ?? "Neutral"}\n"
                + $"- SMA20: ${technicals?.Sma20 ?? 0:F2}, SMA50: ${technicals?.Sma50 ?? 0:F2}, SMA200: ${technicals?.Sma200 ?? 0:F2}\n"
                + $"- ATR: {technicals?.Atr ?? 0:F2}\n\n"
                + "Return a JSON object with exactly this structure:\n"
                + "{\n"
                + "  \"anomalies\": [\n"
                + "    {\n"
                + "      \"type\": \"<anomaly type>\",\n"
                + "      \"severity\": \"High|Medium|Low\",\n"
                + "      \"description\": \"<detailed description>\"\n"
                + "    }\n"
                + "  ],\n"
                + "  \"riskLevel\": \"Elevated|Normal|Low\",\n"
                + "  \"aiInsight\": \"<2-3 sentence market intelligence assessment>\"\n"
                + "}\n\n"
                + "Analyze price action, volume patterns, RSI extremes, MACD divergences, and Bollinger band positions.\n"
                + "If no anomalies exist, include one entry with type \"Normal\" and severity \"Low\".\n"
                + "Return ONLY valid JSON, no markdown.";

            return await _chat.CompleteAsync([("user", prompt)], jsonResponse: true, cancellationToken: cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Anomaly detection failed for {Symbol}", symbol);
            return JsonSerializer.Serialize(new
            {
                anomalies = new[] { new { type = "Normal", severity = "Low", description = "AI analysis temporarily unavailable." } },
                riskLevel = Math.Abs(changePercent) > 3 ? "Elevated" : "Normal",
                aiInsight = "AI anomaly detection is temporarily unavailable."
            });
        }
    }

    public async Task<string> NaturalQueryAsync(string query, string marketContext, CancellationToken cancellationToken = default)
    {
        try
        {
            var prompt = "You are SignalForge AI, a stock market intelligence assistant.\n"
                + "The user asks a natural language question about stocks or the market.\n\n"
                + $"Available market context:\n{marketContext}\n\n"
                + $"User Query: \"{query}\"\n\n"
                + "Return a JSON object with exactly this structure:\n"
                + "{\n"
                + "  \"interpretation\": \"<what the user is asking for>\",\n"
                + "  \"answer\": \"<detailed 2-4 sentence answer based on available data>\",\n"
                + "  \"results\": [\n"
                + "    { \"symbol\": \"<ticker>\", \"metric\": \"<relevant metric name>\", \"value\": \"<value>\" }\n"
                + "  ],\n"
                + "  \"suggestedFollowUps\": [\"<follow-up question 1>\", \"<follow-up question 2>\"]\n"
                + "}\n\n"
                + "If you can identify specific stocks from the query, include them in results.\n"
                + "Return ONLY valid JSON, no markdown.";

            return await _chat.CompleteAsync([("user", prompt)], jsonResponse: true, cancellationToken: cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Natural language query failed");
            return JsonSerializer.Serialize(new
            {
                interpretation = $"Searching for: {query}",
                answer = "AI query processing is temporarily unavailable. Please try again.",
                results = Array.Empty<object>(),
                suggestedFollowUps = new[] { "Try again", "Search by ticker symbol" }
            });
        }
    }

    public async Task<string> GenerateThesisAsync(string symbol, decimal price, TechnicalDataDto? technicals, SentimentResultDto sentiment, long callVol, long putVol, int unusualCount, CancellationToken cancellationToken = default)
    {
        try
        {
            var prompt = $"You are a senior equity research analyst. Generate a comprehensive trade thesis for {symbol}.\n\n"
                + $"Market Data:\n"
                + $"- Current Price: ${price:F2}\n"
                + $"- RSI: {technicals?.Rsi ?? 50:F1}, MACD: {technicals?.Macd ?? 0:F2}, Trend: {technicals?.Trend ?? "Neutral"}\n"
                + $"- SMA20: ${technicals?.Sma20 ?? 0:F2}, SMA50: ${technicals?.Sma50 ?? 0:F2}, SMA200: ${technicals?.Sma200 ?? 0:F2}\n"
                + $"- News Sentiment: {sentiment.Label} (score: {sentiment.Score:F2}, {sentiment.ArticlesAnalyzed} articles)\n"
                + $"- Options: {callVol:N0} call vol vs {putVol:N0} put vol, {unusualCount} unusual trades\n\n"
                + "Return a JSON object with exactly this structure:\n"
                + "{\n"
                + "  \"thesis\": \"<3-4 sentence comprehensive thesis>\",\n"
                + "  \"bullCase\": \"<2-3 sentence bull case with specific price targets>\",\n"
                + "  \"bearCase\": \"<2-3 sentence bear case with risk factors>\",\n"
                + "  \"keyDrivers\": [\"<driver1>\", \"<driver2>\", \"<driver3>\"],\n"
                + "  \"riskFactors\": [\"<risk1>\", \"<risk2>\"],\n"
                + "  \"timeframe\": \"<recommended holding period>\"\n"
                + "}\n\n"
                + "Be specific about price levels, support/resistance, and catalysts.\n"
                + "Return ONLY valid JSON, no markdown.";

            return await _chat.CompleteAsync([("user", prompt)], jsonResponse: true, cancellationToken: cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Thesis generation failed for {Symbol}", symbol);
            return JsonSerializer.Serialize(new
            {
                thesis = $"AI thesis generation temporarily unavailable for {symbol}.",
                bullCase = "Bull case analysis pending.",
                bearCase = "Bear case analysis pending.",
                keyDrivers = new[] { "Technical momentum", "Sentiment", "Options flow" },
                riskFactors = new[] { "Market volatility", "Sector rotation" },
                timeframe = "1-2 Weeks"
            });
        }
    }

    private static string FallbackPrediction(string symbol, decimal price, TechnicalDataDto tech)
    {
        var trend = tech.Trend == "Bullish" ? 1 : tech.Trend == "Bearish" ? -1 : 0;
        return JsonSerializer.Serialize(new
        {
            predictions = new[]
            {
                new { horizon = "7 Days", price = Math.Round(price * (1 + trend * 0.015m), 2), change = Math.Round(trend * 1.5m, 2), confidence = 55, direction = trend >= 0 ? "Bullish" : "Bearish" },
                new { horizon = "30 Days", price = Math.Round(price * (1 + trend * 0.04m), 2), change = Math.Round(trend * 4m, 2), confidence = 45, direction = trend >= 0 ? "Bullish" : "Bearish" },
                new { horizon = "90 Days", price = Math.Round(price * (1 + trend * 0.08m), 2), change = Math.Round(trend * 8m, 2), confidence = 35, direction = trend >= 0 ? "Bullish" : "Bearish" },
            },
            factors = new[]
            {
                new { name = "Technical Trend", impact = tech.Trend, weight = 40 },
                new { name = "RSI Level", impact = tech.Rsi < 30 ? "Oversold" : tech.Rsi > 70 ? "Overbought" : "Neutral", weight = 30 },
                new { name = "MACD Signal", impact = tech.Macd > 0 ? "Positive" : "Negative", weight = 30 },
            },
            summary = $"AI prediction unavailable. Fallback analysis for {symbol} based on technical indicators."
        });
    }

    private static string FallbackOptimization(List<(string Symbol, decimal Quantity, decimal AvgCost, TechnicalDataDto? Tech)> positions)
    {
        var totalValue = positions.Sum(p => p.Quantity * p.AvgCost);
        return JsonSerializer.Serialize(new
        {
            suggestions = positions.Select(p =>
            {
                var weight = totalValue > 0 ? Math.Round(p.Quantity * p.AvgCost / totalValue * 100, 1) : 0;
                return new { symbol = p.Symbol, currentWeight = weight, targetWeight = weight, action = "Hold", reason = "AI optimization temporarily unavailable.", rsi = p.Tech?.Rsi ?? 50, trend = p.Tech?.Trend ?? "Neutral" };
            }),
            summary = new { totalPositions = positions.Count, totalValue = Math.Round(totalValue, 2), diversificationScore = Math.Min(positions.Count * 15, 100), concentrationRisk = "Unknown", overallHealth = "AI analysis pending" }
        });
    }
}
