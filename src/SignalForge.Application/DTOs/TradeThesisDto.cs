namespace SignalForge.Application.DTOs;

public record TradeThesisDto(
    string Symbol,
    string Verdict,
    decimal ConfidenceScore,
    string ExecutiveSummary,
    string BullCase,
    string BearCase,
    decimal SuggestedEntry,
    decimal StopLoss,
    decimal TargetPrice,
    decimal RiskRewardRatio,
    string TimeHorizon,
    List<ThesisFactorDto> KeyFactors,
    string GeneratedAt
);

public record ThesisFactorDto(string Name, decimal Score, string Impact, string Detail);

public record FearGreedDto(
    int Score,
    string Label,
    int Momentum,
    int Breadth,
    int PutCallRatio,
    int Volatility,
    int SafeHaven,
    int JunkBondDemand,
    string UpdatedAt
);

public record MarketPulseEventDto(
    string Id,
    string Type,
    string Symbol,
    string Title,
    string Description,
    string Impact,
    string Timestamp
);

public record SmartMoneyFlowDto(
    string Symbol,
    decimal InstitutionalBuy,
    decimal InstitutionalSell,
    decimal RetailBuy,
    decimal RetailSell,
    decimal NetFlow,
    string Signal,
    decimal DarkPoolPercent
);
