using FluentValidation;
using SignalForge.Application.Commands.Watchlist;

namespace SignalForge.Application.Validators;

public class AddToWatchlistValidator : AbstractValidator<AddToWatchlistCommand>
{
    public AddToWatchlistValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.Symbol).NotEmpty().MaximumLength(10);
    }
}
