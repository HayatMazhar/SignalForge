using SignalForge.Domain.Enums;

namespace SignalForge.Domain.Entities;

public class Alert : BaseEntity
{
    public string UserId { get; set; } = string.Empty;
    public string Symbol { get; set; } = string.Empty;
    public AlertType AlertType { get; set; }
    public decimal TargetValue { get; set; }
    public bool IsActive { get; set; } = true;
}
