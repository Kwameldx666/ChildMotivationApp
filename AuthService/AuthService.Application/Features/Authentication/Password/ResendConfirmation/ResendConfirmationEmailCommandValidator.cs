using FluentValidation;

namespace AuthService.Application.Features.Authentication.Password.ResendConfirmation;

public class ResendConfirmationEmailCommandValidator : AbstractValidator<ResendConfirmationEmailCommand>
{
    public ResendConfirmationEmailCommandValidator()
    {
        RuleFor(x => x.Email)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Email обязателен.")
            .MaximumLength(256)
            .EmailAddress().WithMessage("Некорректный формат email.");
    }
}
