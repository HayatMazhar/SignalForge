namespace SignalForge.Application.DTOs;

public record BacktestRequestDto(
    string Symbol,
    string Strategy,
    decimal InitialCapital,
    int LookbackDays,
    decimal StopLossPercent,
    decimal TakeProfitPercent
);

public record BacktestResultDto(
    string Symbol,
    string Strategy,
    decimal InitialCapital,
    decimal FinalCapital,
    decimal TotalReturn,
    decimal TotalReturnPercent,
    int TotalTrades,
    int WinningTrades,
    int LosingTrades,
    decimal WinRate,
    decimal MaxDrawdown,
    decimal SharpeRatio,
    decimal ProfitFactor,
    List<BacktestTradeDto> Trades,
    List<BacktestEquityPointDto> EquityCurve
);

public record BacktestTradeDto(
    string Type,
    decimal EntryPrice,
    decimal ExitPrice,
    decimal PnL,
    decimal PnLPercent,
    string EntryDate,
    string ExitDate,
    string Reason
);

public record BacktestEquityPointDto(string Date, decimal Equity, decimal DrawdownPercent);

public record ChatMessageDto(string Role, string Content, string? Symbol, string Timestamp);
public record ChatRequestDto(string Message, string? Symbol, List<ChatMessageDto>? History);
public record ChatResponseDto(string Response, string? Symbol, List<string>? SuggestedActions);

public record LeaderboardEntryDto(
    string UserId, string UserName, string Avatar,
    int TotalSignals, int WinningSignals, decimal WinRate,
    decimal AvgConfidence, decimal TotalReturn, int Followers, int Rank
);

public record ComparisonDto(
    string Symbol, decimal Price, decimal ChangePercent,
    decimal Rsi, string Trend, decimal SentimentScore,
    decimal Pe, decimal MarketCap, string Sector
);
