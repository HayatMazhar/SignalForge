namespace SignalForge.Application.DTOs;

public record NewsArticleDto(Guid Id, string Symbol, string Title, string Url, string Source, DateTime PublishedAt, decimal SentimentScore, string Summary);
