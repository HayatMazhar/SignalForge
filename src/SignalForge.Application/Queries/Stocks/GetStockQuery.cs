using MediatR;
using SignalForge.Application.DTOs;
using SignalForge.Application.Interfaces;
namespace SignalForge.Application.Queries.Stocks;

public record GetStockQuery(string Symbol) : IRequest<StockDto?>;

public class GetStockQueryHandler : IRequestHandler<GetStockQuery, StockDto?>
{
    private readonly IApplicationDbContext _db;
    public GetStockQueryHandler(IApplicationDbContext db) { _db = db; }
    public async Task<StockDto?> Handle(GetStockQuery request, CancellationToken cancellationToken)
    {
        var stock = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions
            .FirstOrDefaultAsync(_db.Stocks, s => s.Symbol == request.Symbol, cancellationToken);
        return stock is null ? null : new StockDto(stock.Id, stock.Symbol, stock.Name, stock.Sector, stock.Exchange, stock.MarketCap, stock.LogoUrl);
    }
}
