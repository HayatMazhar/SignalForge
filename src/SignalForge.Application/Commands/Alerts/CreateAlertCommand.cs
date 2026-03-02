using MediatR;
using SignalForge.Application.DTOs;
using SignalForge.Application.Interfaces;
using SignalForge.Domain.Entities;
namespace SignalForge.Application.Commands.Alerts;

public record CreateAlertCommand(string UserId, CreateAlertDto Alert) : IRequest<AlertDto>;

public class CreateAlertCommandHandler : IRequestHandler<CreateAlertCommand, AlertDto>
{
    private readonly IApplicationDbContext _db;
    public CreateAlertCommandHandler(IApplicationDbContext db) { _db = db; }
    public async Task<AlertDto> Handle(CreateAlertCommand request, CancellationToken cancellationToken)
    {
        var alert = new Alert
        {
            UserId = request.UserId,
            Symbol = request.Alert.Symbol.ToUpperInvariant(),
            AlertType = request.Alert.AlertType,
            TargetValue = request.Alert.TargetValue
        };
        _db.Alerts.Add(alert);
        await _db.SaveChangesAsync(cancellationToken);
        return new AlertDto(alert.Id, alert.Symbol, alert.AlertType, alert.TargetValue, alert.IsActive, alert.CreatedAt);
    }
}
