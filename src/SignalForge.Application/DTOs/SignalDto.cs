using SignalForge.Domain.Enums;
namespace SignalForge.Application.DTOs;

public record SignalDto(Guid Id, string Symbol, SignalType Type, decimal ConfidenceScore, string Reasoning, decimal TechnicalScore, decimal SentimentScore, decimal OptionsScore, DateTime GeneratedAt);
