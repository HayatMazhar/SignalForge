using FluentValidation;
using SignalForge.Application.Commands.Alerts;

namespace SignalForge.Application.Validators;

public class CreateAlertValidator : AbstractValidator<CreateAlertCommand>
{
    public CreateAlertValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.Alert).NotNull();
        RuleFor(x => x.Alert.Symbol).NotEmpty().MaximumLength(10);
        RuleFor(x => x.Alert.TargetValue).GreaterThan(0);
        RuleFor(x => x.Alert.AlertType).IsInEnum();
    }
}
