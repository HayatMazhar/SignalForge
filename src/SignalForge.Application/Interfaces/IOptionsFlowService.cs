using SignalForge.Application.DTOs;
namespace SignalForge.Application.Interfaces;

public interface IOptionsFlowService
{
    Task<List<OptionsFlowDto>> GetUnusualFlow(CancellationToken cancellationToken = default);
    Task<List<OptionsFlowDto>> GetSymbolFlow(string symbol, CancellationToken cancellationToken = default);
}
