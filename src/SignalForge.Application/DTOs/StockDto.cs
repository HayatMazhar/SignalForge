namespace SignalForge.Application.DTOs;

public record StockDto(Guid Id, string Symbol, string Name, string Sector, string Exchange, decimal MarketCap, string? LogoUrl);
public record StockQuoteDto(string Symbol, decimal Price, decimal Change, decimal ChangePercent, decimal High, decimal Low, decimal Open, long Volume, DateTime Timestamp);
public record OhlcBarDto(DateTime Date, decimal Open, decimal High, decimal Low, decimal Close, long Volume);
public record TopMoverDto(string Symbol, string Name, decimal Price, decimal ChangePercent);
