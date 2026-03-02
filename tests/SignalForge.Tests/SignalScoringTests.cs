using Microsoft.EntityFrameworkCore;
using Moq;
using SignalForge.Application.Commands.Signals;
using SignalForge.Application.DTOs;
using SignalForge.Application.Interfaces;
using SignalForge.Domain.Enums;
using SignalForge.Infrastructure.Data;

namespace SignalForge.Tests;

public class SignalScoringTests
{
    private readonly Mock<IMarketDataService> _marketDataMock = new();
    private readonly Mock<INewsService> _newsServiceMock = new();
    private readonly Mock<IOptionsFlowService> _optionsFlowMock = new();
    private readonly Mock<IAISignalService> _aiServiceMock = new();

    private ApplicationDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }

    [Fact]
    public async Task GenerateSignal_BullishData_ReturnsBuySignal()
    {
        var db = CreateDb();
        var handler = new GenerateSignalCommandHandler(
            _marketDataMock.Object, _newsServiceMock.Object,
            _optionsFlowMock.Object, _aiServiceMock.Object, db);

        _marketDataMock.Setup(x => x.GetTechnicalIndicators("AAPL", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TechnicalDataDto(25, 5, 2, 180, 175, 170, 190, 165, 3, "Bullish"));

        _newsServiceMock.Setup(x => x.GetNews("AAPL", 10, It.IsAny<CancellationToken>()))
            .ReturnsAsync([new NewsArticleDto(Guid.NewGuid(), "AAPL", "Apple hits record", "", "Reuters", DateTime.UtcNow, 0.8m, "")]);

        _optionsFlowMock.Setup(x => x.GetSymbolFlow("AAPL", It.IsAny<CancellationToken>()))
            .ReturnsAsync([
                new OptionsFlowDto(Guid.NewGuid(), "AAPL", 180, DateTime.UtcNow.AddDays(30),
                    OptionType.Call, 10000, 5000, 0.3m, 50000, true, DateTime.UtcNow),
            ]);

        _aiServiceMock.Setup(x => x.AnalyzeSentiment(It.IsAny<List<string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new SentimentResultDto(0.8m, "Bullish", 1));

        _aiServiceMock.Setup(x => x.GenerateSignalReasoning(It.IsAny<string>(), It.IsAny<TechnicalDataDto>(),
                It.IsAny<SentimentResultDto>(), It.IsAny<List<OptionsFlowDto>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("Strong bullish momentum.");

        var result = await handler.Handle(new GenerateSignalCommand("AAPL"), CancellationToken.None);

        Assert.Equal("AAPL", result.Symbol);
        Assert.Equal(SignalType.Buy, result.Type);
        Assert.True(result.ConfidenceScore >= 65);
    }

    [Fact]
    public async Task GenerateSignal_SavesSignalToDatabase()
    {
        var db = CreateDb();
        var handler = new GenerateSignalCommandHandler(
            _marketDataMock.Object, _newsServiceMock.Object,
            _optionsFlowMock.Object, _aiServiceMock.Object, db);

        _marketDataMock.Setup(x => x.GetTechnicalIndicators(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TechnicalDataDto(50, 0, 0, 180, 175, 170, 190, 165, 3, "Neutral"));

        _newsServiceMock.Setup(x => x.GetNews(It.IsAny<string>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        _optionsFlowMock.Setup(x => x.GetSymbolFlow(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        _aiServiceMock.Setup(x => x.AnalyzeSentiment(It.IsAny<List<string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new SentimentResultDto(0, "Neutral", 0));

        _aiServiceMock.Setup(x => x.GenerateSignalReasoning(It.IsAny<string>(), It.IsAny<TechnicalDataDto>(),
                It.IsAny<SentimentResultDto>(), It.IsAny<List<OptionsFlowDto>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("Mixed signals.");

        await handler.Handle(new GenerateSignalCommand("MSFT"), CancellationToken.None);

        Assert.Single(db.Signals);
        Assert.Equal("MSFT", db.Signals.First().Symbol);
    }
}
