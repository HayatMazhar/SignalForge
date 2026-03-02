using AutoMapper;
using SignalForge.Application.DTOs;
using SignalForge.Domain.Entities;

namespace SignalForge.Application.Mappings;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<Stock, StockDto>();
        CreateMap<Signal, SignalDto>();
        CreateMap<NewsArticle, NewsArticleDto>();
        CreateMap<OptionsFlow, OptionsFlowDto>();
        CreateMap<Alert, AlertDto>();
        CreateMap<Portfolio, PortfolioPositionDto>();
        CreateMap<UserWatchlist, WatchlistItemDto>();
    }
}
