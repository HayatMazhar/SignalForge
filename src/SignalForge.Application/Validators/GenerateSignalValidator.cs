using FluentValidation;
using SignalForge.Application.Commands.Signals;

namespace SignalForge.Application.Validators;

public class GenerateSignalValidator : AbstractValidator<GenerateSignalCommand>
{
    public GenerateSignalValidator()
    {
        RuleFor(x => x.Symbol)
            .NotEmpty().WithMessage("Symbol is required")
            .MaximumLength(10).WithMessage("Symbol must be 10 characters or fewer")
            .Matches(@"^[A-Z]+$").WithMessage("Symbol must be uppercase letters only");
    }
}
