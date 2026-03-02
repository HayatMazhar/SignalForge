using Microsoft.EntityFrameworkCore;
using SignalForge.Domain.Entities;
namespace SignalForge.Application.Interfaces;

public interface IApplicationDbContext
{
    DbSet<Stock> Stocks { get; }
    DbSet<Signal> Signals { get; }
    DbSet<NewsArticle> NewsArticles { get; }
    DbSet<OptionsFlow> OptionsFlows { get; }
    DbSet<UserWatchlist> UserWatchlists { get; }
    DbSet<Alert> Alerts { get; }
    DbSet<Portfolio> Portfolios { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
