using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SignalForge.Domain.Entities;
using SignalForge.Domain.Enums;
using SignalForge.Infrastructure.Identity;

namespace SignalForge.Infrastructure.Data;

public static class DataSeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();

        if (db.Database.IsRelational())
            await db.Database.MigrateAsync();
        else
            await db.Database.EnsureCreatedAsync();

        await SeedRoles(roleManager);
        await SeedStocks(db);
        await SeedUsers(userManager);
        await SeedSignals(db);
    }

    private static async Task SeedRoles(RoleManager<IdentityRole> roleManager)
    {
        var roles = new[] { "Admin", "Moderator", "Analyst", "User" };
        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new IdentityRole(role));
        }
    }

    private static async Task SeedStocks(ApplicationDbContext db)
    {
        if (await db.Stocks.AnyAsync()) return;

        var stocks = new List<Stock>
        {
            S("AAPL", "Apple Inc.", "Technology", "NASDAQ", 2900000000000m),
            S("MSFT", "Microsoft Corporation", "Technology", "NASDAQ", 2800000000000m),
            S("GOOGL", "Alphabet Inc.", "Technology", "NASDAQ", 1700000000000m),
            S("AMZN", "Amazon.com Inc.", "Consumer Cyclical", "NASDAQ", 1500000000000m),
            S("NVDA", "NVIDIA Corporation", "Technology", "NASDAQ", 1200000000000m),
            S("TSLA", "Tesla Inc.", "Consumer Cyclical", "NASDAQ", 800000000000m),
            S("META", "Meta Platforms Inc.", "Technology", "NASDAQ", 750000000000m),
            S("BRK.B", "Berkshire Hathaway", "Financial Services", "NYSE", 700000000000m),
            S("JPM", "JPMorgan Chase & Co.", "Financial Services", "NYSE", 430000000000m),
            S("V", "Visa Inc.", "Financial Services", "NYSE", 470000000000m),
            S("JNJ", "Johnson & Johnson", "Healthcare", "NYSE", 420000000000m),
            S("WMT", "Walmart Inc.", "Consumer Defensive", "NYSE", 400000000000m),
            S("PG", "Procter & Gamble", "Consumer Defensive", "NYSE", 350000000000m),
            S("MA", "Mastercard Inc.", "Financial Services", "NYSE", 340000000000m),
            S("UNH", "UnitedHealth Group", "Healthcare", "NYSE", 450000000000m),
            S("HD", "Home Depot Inc.", "Consumer Cyclical", "NYSE", 300000000000m),
            S("DIS", "Walt Disney Co.", "Communication Services", "NYSE", 180000000000m),
            S("PYPL", "PayPal Holdings", "Financial Services", "NASDAQ", 80000000000m),
            S("NFLX", "Netflix Inc.", "Communication Services", "NASDAQ", 200000000000m),
            S("ADBE", "Adobe Inc.", "Technology", "NASDAQ", 220000000000m),
            S("CRM", "Salesforce Inc.", "Technology", "NYSE", 210000000000m),
            S("INTC", "Intel Corporation", "Technology", "NASDAQ", 120000000000m),
            S("AMD", "Advanced Micro Devices", "Technology", "NASDAQ", 180000000000m),
            S("CSCO", "Cisco Systems", "Technology", "NASDAQ", 200000000000m),
            S("ORCL", "Oracle Corporation", "Technology", "NYSE", 290000000000m),
            S("IBM", "International Business Machines", "Technology", "NYSE", 130000000000m),
            S("QCOM", "Qualcomm Inc.", "Technology", "NASDAQ", 150000000000m),
            S("TXN", "Texas Instruments", "Technology", "NASDAQ", 160000000000m),
            S("AVGO", "Broadcom Inc.", "Technology", "NASDAQ", 350000000000m),
            S("COST", "Costco Wholesale", "Consumer Defensive", "NASDAQ", 250000000000m),
            S("ABBV", "AbbVie Inc.", "Healthcare", "NYSE", 250000000000m),
            S("PFE", "Pfizer Inc.", "Healthcare", "NYSE", 160000000000m),
            S("MRK", "Merck & Co.", "Healthcare", "NYSE", 270000000000m),
            S("LLY", "Eli Lilly and Co.", "Healthcare", "NYSE", 400000000000m),
            S("TMO", "Thermo Fisher Scientific", "Healthcare", "NYSE", 200000000000m),
            S("CMCSA", "Comcast Corporation", "Communication Services", "NASDAQ", 150000000000m),
            S("VZ", "Verizon Communications", "Communication Services", "NYSE", 150000000000m),
            S("T", "AT&T Inc.", "Communication Services", "NYSE", 110000000000m),
            S("BA", "Boeing Company", "Industrials", "NYSE", 120000000000m),
            S("CAT", "Caterpillar Inc.", "Industrials", "NYSE", 130000000000m),
            S("GE", "General Electric", "Industrials", "NYSE", 120000000000m),
            S("MMM", "3M Company", "Industrials", "NYSE", 60000000000m),
            S("XOM", "Exxon Mobil Corp.", "Energy", "NYSE", 450000000000m),
            S("CVX", "Chevron Corporation", "Energy", "NYSE", 300000000000m),
            S("COP", "ConocoPhillips", "Energy", "NYSE", 130000000000m),
            S("GS", "Goldman Sachs", "Financial Services", "NYSE", 110000000000m),
            S("MS", "Morgan Stanley", "Financial Services", "NYSE", 140000000000m),
            S("BAC", "Bank of America", "Financial Services", "NYSE", 230000000000m),
            S("C", "Citigroup Inc.", "Financial Services", "NYSE", 90000000000m),
            S("COIN", "Coinbase Global", "Financial Services", "NASDAQ", 40000000000m),
        };

        db.Stocks.AddRange(stocks);
        await db.SaveChangesAsync();
    }

    private static Stock S(string symbol, string name, string sector, string exchange, decimal marketCap) =>
        new() { Symbol = symbol, Name = name, Sector = sector, Exchange = exchange, MarketCap = marketCap };

    private static async Task SeedUsers(UserManager<ApplicationUser> userManager)
    {
        var users = new (string Email, string Password, string Name, string Tier, string Role)[]
        {
            ("admin@signalforge.com", "Admin@12345!", "System Admin", "elite", "Admin"),
            ("free@signalforge.com", "FreeUser123!", "Free User", "free", "User"),
            ("pro@signalforge.com", "ProUser123!", "Pro User", "pro", "User"),
            ("elite@signalforge.com", "EliteUser123!", "Elite User", "elite", "Analyst"),
            ("mod@signalforge.com", "Moderator123!", "Moderator", "pro", "Moderator"),
        };

        foreach (var (email, password, name, tier, role) in users)
        {
            var existing = await userManager.FindByEmailAsync(email);
            if (existing is not null)
            {
                if (!await userManager.IsInRoleAsync(existing, role))
                    await userManager.AddToRoleAsync(existing, role);
                continue;
            }
            var user = new ApplicationUser { UserName = email, Email = email, FullName = name, Tier = tier };
            var result = await userManager.CreateAsync(user, password);
            if (result.Succeeded)
                await userManager.AddToRoleAsync(user, role);
        }
    }

    private static async Task SeedSignals(ApplicationDbContext db)
    {
        if (await db.Signals.AnyAsync()) return;

        var rng = new Random(42);
        var symbols = new[] { "AAPL", "MSFT", "GOOGL", "TSLA", "NVDA", "AMZN", "META", "AMD", "NFLX", "CRM" };
        var signals = new List<Signal>();

        foreach (var symbol in symbols)
        {
            for (int day = 0; day < 7; day++)
            {
                var tech = rng.Next(20, 85);
                var sent = rng.Next(20, 85);
                var opts = rng.Next(20, 85);
                var confidence = tech * 0.4m + sent * 0.3m + opts * 0.3m;
                var type = confidence >= 65 ? SignalType.Buy : confidence <= 35 ? SignalType.Sell : SignalType.Hold;

                signals.Add(new Signal
                {
                    Symbol = symbol,
                    Type = type,
                    ConfidenceScore = Math.Round(confidence, 2),
                    TechnicalScore = tech,
                    SentimentScore = sent,
                    OptionsScore = opts,
                    Reasoning = GenerateReasoning(symbol, type, confidence),
                    GeneratedAt = DateTime.UtcNow.AddDays(-day).AddHours(-rng.Next(0, 12)),
                });
            }
        }

        db.Signals.AddRange(signals);
        await db.SaveChangesAsync();
    }

    private static string GenerateReasoning(string symbol, SignalType type, decimal confidence) => type switch
    {
        SignalType.Buy => $"{symbol} shows strong bullish momentum with a confidence score of {confidence:F1}%. Technical indicators suggest an upward trend supported by positive market sentiment and favorable options flow activity.",
        SignalType.Sell => $"{symbol} exhibits bearish signals with a confidence score of {confidence:F1}%. Technical analysis indicates weakening momentum, combined with negative sentiment and put-heavy options activity.",
        _ => $"{symbol} presents a neutral outlook with a confidence score of {confidence:F1}%. Mixed technical signals suggest consolidation, while sentiment and options flow provide no clear directional bias.",
    };
}
