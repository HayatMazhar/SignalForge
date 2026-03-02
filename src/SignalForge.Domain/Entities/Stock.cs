namespace SignalForge.Domain.Entities;

public class Stock : BaseEntity
{
    public string Symbol { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Sector { get; set; } = string.Empty;
    public string Exchange { get; set; } = string.Empty;
    public decimal MarketCap { get; set; }
    public string? LogoUrl { get; set; }
}
