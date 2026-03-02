namespace SignalForge.Domain.Entities;

public class UserWatchlist : BaseEntity
{
    public string UserId { get; set; } = string.Empty;
    public string Symbol { get; set; } = string.Empty;
    public DateTime AddedAt { get; set; } = DateTime.UtcNow;
}
