namespace SignalForge.Domain.Entities;

public class Portfolio : BaseEntity
{
    public string UserId { get; set; } = string.Empty;
    public string Symbol { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public decimal AverageCost { get; set; }
    public DateTime AddedAt { get; set; } = DateTime.UtcNow;
}
