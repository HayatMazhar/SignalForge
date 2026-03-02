using Microsoft.EntityFrameworkCore;
using Moq;
using SignalForge.Application.Commands.Watchlist;
using SignalForge.Application.DTOs;
using SignalForge.Application.Interfaces;
using SignalForge.Application.Queries.Signals;
using SignalForge.Application.Queries.Stocks;
using SignalForge.Domain.Entities;
using SignalForge.Domain.Enums;
using SignalForge.Infrastructure.Data;

namespace SignalForge.Tests;

public class MediatRHandlerTests
{
    private ApplicationDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }

    [Fact]
    public async Task GetStockQuery_ExistingStock_ReturnsDto()
    {
        var db = CreateDb();
        db.Stocks.Add(new Stock { Symbol = "AAPL", Name = "Apple Inc.", Sector = "Tech", Exchange = "NASDAQ" });
        await db.SaveChangesAsync();

        var handler = new GetStockQueryHandler(db);
        var result = await handler.Handle(new GetStockQuery("AAPL"), CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal("AAPL", result!.Symbol);
        Assert.Equal("Apple Inc.", result.Name);
    }

    [Fact]
    public async Task GetStockQuery_NonExistentStock_ReturnsNull()
    {
        var db = CreateDb();
        var handler = new GetStockQueryHandler(db);
        var result = await handler.Handle(new GetStockQuery("ZZZZ"), CancellationToken.None);

        Assert.Null(result);
    }

    [Fact]
    public async Task AddToWatchlist_NewSymbol_Succeeds()
    {
        var db = CreateDb();
        var handler = new AddToWatchlistCommandHandler(db);

        var result = await handler.Handle(new AddToWatchlistCommand("user1", "AAPL"), CancellationToken.None);

        Assert.Equal("AAPL", result.Symbol);
        Assert.Single(db.UserWatchlists);
    }

    [Fact]
    public async Task AddToWatchlist_DuplicateSymbol_ThrowsException()
    {
        var db = CreateDb();
        db.UserWatchlists.Add(new UserWatchlist { UserId = "user1", Symbol = "AAPL" });
        await db.SaveChangesAsync();

        var handler = new AddToWatchlistCommandHandler(db);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            handler.Handle(new AddToWatchlistCommand("user1", "AAPL"), CancellationToken.None));
    }

    [Fact]
    public async Task GetSignalsQuery_FilterByType_ReturnsFiltered()
    {
        var db = CreateDb();
        db.Signals.AddRange(
            new Signal { Symbol = "AAPL", Type = SignalType.Buy, ConfidenceScore = 75, Reasoning = "Buy", GeneratedAt = DateTime.UtcNow },
            new Signal { Symbol = "MSFT", Type = SignalType.Sell, ConfidenceScore = 30, Reasoning = "Sell", GeneratedAt = DateTime.UtcNow },
            new Signal { Symbol = "GOOGL", Type = SignalType.Buy, ConfidenceScore = 80, Reasoning = "Buy", GeneratedAt = DateTime.UtcNow }
        );
        await db.SaveChangesAsync();

        var handler = new GetSignalsQueryHandler(db);
        var result = await handler.Handle(new GetSignalsQuery(SignalType.Buy, 50), CancellationToken.None);

        Assert.Equal(2, result.Count);
        Assert.All(result, s => Assert.Equal(SignalType.Buy, s.Type));
    }

    [Fact]
    public async Task RemoveFromWatchlist_ExistingItem_ReturnsTrue()
    {
        var db = CreateDb();
        db.UserWatchlists.Add(new UserWatchlist { UserId = "user1", Symbol = "AAPL" });
        await db.SaveChangesAsync();

        var handler = new RemoveFromWatchlistCommandHandler(db);
        var result = await handler.Handle(new RemoveFromWatchlistCommand("user1", "AAPL"), CancellationToken.None);

        Assert.True(result);
        Assert.Empty(db.UserWatchlists);
    }
}
