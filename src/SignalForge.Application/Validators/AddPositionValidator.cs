using FluentValidation;
using SignalForge.Application.Commands.Portfolio;

namespace SignalForge.Application.Validators;

public class AddPositionValidator : AbstractValidator<AddPositionCommand>
{
    public AddPositionValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.Position).NotNull();
        RuleFor(x => x.Position.Symbol).NotEmpty().MaximumLength(10);
        RuleFor(x => x.Position.Quantity).GreaterThan(0);
        RuleFor(x => x.Position.AverageCost).GreaterThan(0);
    }
}
