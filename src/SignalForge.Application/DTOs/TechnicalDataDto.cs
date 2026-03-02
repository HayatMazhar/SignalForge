namespace SignalForge.Application.DTOs;

public record TechnicalDataDto(decimal Rsi, decimal Macd, decimal MacdSignal, decimal Sma20, decimal Sma50, decimal Sma200, decimal BollingerUpper, decimal BollingerLower, decimal Atr, string Trend);
public record SentimentResultDto(decimal Score, string Label, int ArticlesAnalyzed);
