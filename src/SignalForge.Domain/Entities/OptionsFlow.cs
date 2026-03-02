using SignalForge.Domain.Enums;

namespace SignalForge.Domain.Entities;

public class OptionsFlow : BaseEntity
{
    public string Symbol { get; set; } = string.Empty;
    public decimal Strike { get; set; }
    public DateTime Expiry { get; set; }
    public OptionType Type { get; set; }
    public long Volume { get; set; }
    public long OpenInterest { get; set; }
    public decimal ImpliedVolatility { get; set; }
    public decimal Premium { get; set; }
    public bool IsUnusual { get; set; }
    public DateTime DetectedAt { get; set; } = DateTime.UtcNow;
}
