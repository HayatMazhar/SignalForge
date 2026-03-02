using SignalForge.Domain.Enums;

namespace SignalForge.Domain.Entities;

public class Signal : BaseEntity
{
    public string Symbol { get; set; } = string.Empty;
    public SignalType Type { get; set; }
    public decimal ConfidenceScore { get; set; }
    public string Reasoning { get; set; } = string.Empty;
    public decimal TechnicalScore { get; set; }
    public decimal SentimentScore { get; set; }
    public decimal OptionsScore { get; set; }
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
}
