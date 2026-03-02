namespace SignalForge.Domain.Entities;

public class NewsArticle : BaseEntity
{
    public string Symbol { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string Source { get; set; } = string.Empty;
    public DateTime PublishedAt { get; set; }
    public decimal SentimentScore { get; set; }
    public string Summary { get; set; } = string.Empty;
}
