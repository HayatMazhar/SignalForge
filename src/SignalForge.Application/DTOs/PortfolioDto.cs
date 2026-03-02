namespace SignalForge.Application.DTOs;

public record PortfolioPositionDto(Guid Id, string Symbol, decimal Quantity, decimal AverageCost, DateTime AddedAt);
public record AddPositionDto(string Symbol, decimal Quantity, decimal AverageCost);
