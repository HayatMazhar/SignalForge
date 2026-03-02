using SignalForge.Domain.Enums;
namespace SignalForge.Application.DTOs;

public record AlertDto(Guid Id, string Symbol, AlertType AlertType, decimal TargetValue, bool IsActive, DateTime CreatedAt);
public record CreateAlertDto(string Symbol, AlertType AlertType, decimal TargetValue);
