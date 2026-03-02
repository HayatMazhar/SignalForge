using SignalForge.Domain.Enums;
namespace SignalForge.Application.DTOs;

public record OptionsFlowDto(Guid Id, string Symbol, decimal Strike, DateTime Expiry, OptionType Type, long Volume, long OpenInterest, decimal ImpliedVolatility, decimal Premium, bool IsUnusual, DateTime DetectedAt);
