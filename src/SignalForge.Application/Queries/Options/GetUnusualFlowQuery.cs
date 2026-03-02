using MediatR;
using SignalForge.Application.DTOs;
using SignalForge.Application.Interfaces;
namespace SignalForge.Application.Queries.Options;

public record GetUnusualFlowQuery() : IRequest<List<OptionsFlowDto>>;

public class GetUnusualFlowQueryHandler : IRequestHandler<GetUnusualFlowQuery, List<OptionsFlowDto>>
{
    private readonly IOptionsFlowService _optionsFlow;
    private readonly ICacheService _cache;
    public GetUnusualFlowQueryHandler(IOptionsFlowService optionsFlow, ICacheService cache) { _optionsFlow = optionsFlow; _cache = cache; }
    public async Task<List<OptionsFlowDto>> Handle(GetUnusualFlowQuery request, CancellationToken cancellationToken)
    {
        var cached = await _cache.GetAsync<List<OptionsFlowDto>>("unusual-flow", cancellationToken);
        if (cached is not null) return cached;
        var result = await _optionsFlow.GetUnusualFlow(cancellationToken);
        await _cache.SetAsync("unusual-flow", result, TimeSpan.FromMinutes(2), cancellationToken);
        return result;
    }
}
