using MediatR;
using Microsoft.EntityFrameworkCore;
using SignalForge.Application.Interfaces;
namespace SignalForge.Application.Commands.Alerts;

public record DeleteAlertCommand(string UserId, Guid AlertId) : IRequest<bool>;

public class DeleteAlertCommandHandler : IRequestHandler<DeleteAlertCommand, bool>
{
    private readonly IApplicationDbContext _db;
    public DeleteAlertCommandHandler(IApplicationDbContext db) { _db = db; }
    public async Task<bool> Handle(DeleteAlertCommand request, CancellationToken cancellationToken)
    {
        var alert = await _db.Alerts.FirstOrDefaultAsync(a => a.Id == request.AlertId && a.UserId == request.UserId, cancellationToken);
        if (alert is null) return false;
        _db.Alerts.Remove(alert);
        await _db.SaveChangesAsync(cancellationToken);
        return true;
    }
}
