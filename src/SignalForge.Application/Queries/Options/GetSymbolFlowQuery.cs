using MediatR;
using SignalForge.Application.DTOs;
using SignalForge.Application.Interfaces;
namespace SignalForge.Application.Queries.Options;

public record GetSymbolFlowQuery(string Symbol) : IRequest<List<OptionsFlowDto>>;

public class GetSymbolFlowQueryHandler : IRequestHandler<GetSymbolFlowQuery, List<OptionsFlowDto>>
{
    private readonly IOptionsFlowService _optionsFlow;
    public GetSymbolFlowQueryHandler(IOptionsFlowService optionsFlow) { _optionsFlow = optionsFlow; }
    public async Task<List<OptionsFlowDto>> Handle(GetSymbolFlowQuery request, CancellationToken cancellationToken)
    {
        return await _optionsFlow.GetSymbolFlow(request.Symbol, cancellationToken);
    }
}
