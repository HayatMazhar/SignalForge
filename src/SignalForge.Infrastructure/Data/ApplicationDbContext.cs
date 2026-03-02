using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using SignalForge.Application.Interfaces;
using SignalForge.Domain.Entities;
using SignalForge.Infrastructure.Identity;

namespace SignalForge.Infrastructure.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>, IApplicationDbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<Stock> Stocks => Set<Stock>();
    public DbSet<Signal> Signals => Set<Signal>();
    public DbSet<NewsArticle> NewsArticles => Set<NewsArticle>();
    public DbSet<OptionsFlow> OptionsFlows => Set<OptionsFlow>();
    public DbSet<UserWatchlist> UserWatchlists => Set<UserWatchlist>();
    public DbSet<Alert> Alerts => Set<Alert>();
    public DbSet<Portfolio> Portfolios => Set<Portfolio>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Stock>(e =>
        {
            e.HasIndex(s => s.Symbol).IsUnique();
            e.Property(s => s.Symbol).HasMaxLength(10);
            e.Property(s => s.Name).HasMaxLength(200);
            e.Property(s => s.MarketCap).HasPrecision(18, 2);
        });

        builder.Entity<Signal>(e =>
        {
            e.HasIndex(s => new { s.Symbol, s.GeneratedAt });
            e.Property(s => s.Symbol).HasMaxLength(10);
            e.Property(s => s.ConfidenceScore).HasPrecision(5, 2);
            e.Property(s => s.TechnicalScore).HasPrecision(5, 2);
            e.Property(s => s.SentimentScore).HasPrecision(5, 2);
            e.Property(s => s.OptionsScore).HasPrecision(5, 2);
        });

        builder.Entity<NewsArticle>(e =>
        {
            e.HasIndex(n => new { n.Symbol, n.PublishedAt });
            e.Property(n => n.Symbol).HasMaxLength(10);
            e.Property(n => n.SentimentScore).HasPrecision(5, 2);
        });

        builder.Entity<OptionsFlow>(e =>
        {
            e.HasIndex(o => new { o.Symbol, o.DetectedAt });
            e.Property(o => o.Symbol).HasMaxLength(10);
            e.Property(o => o.Strike).HasPrecision(10, 2);
            e.Property(o => o.ImpliedVolatility).HasPrecision(8, 4);
            e.Property(o => o.Premium).HasPrecision(12, 2);
        });

        builder.Entity<UserWatchlist>(e =>
        {
            e.HasIndex(w => new { w.UserId, w.Symbol }).IsUnique();
            e.Property(w => w.Symbol).HasMaxLength(10);
        });

        builder.Entity<Alert>(e =>
        {
            e.HasIndex(a => new { a.UserId, a.Symbol });
            e.Property(a => a.Symbol).HasMaxLength(10);
            e.Property(a => a.TargetValue).HasPrecision(12, 2);
        });

        builder.Entity<Portfolio>(e =>
        {
            e.HasIndex(p => new { p.UserId, p.Symbol });
            e.Property(p => p.Symbol).HasMaxLength(10);
            e.Property(p => p.Quantity).HasPrecision(12, 4);
            e.Property(p => p.AverageCost).HasPrecision(12, 2);
        });
    }
}
