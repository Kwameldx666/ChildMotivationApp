using FluentValidation;

namespace AuthService.Application.Features.Authentication.Password.ConfirmEmail;

public class ConfirmEmailCommandValidator : AbstractValidator<ConfirmEmailCommand>
{
    public ConfirmEmailCommandValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("Идентификатор пользователя обязателен.");

        RuleFor(x => x.Token)
            .NotEmpty().WithMessage("Токен подтверждения обязателен.")
            .MaximumLength(1024);
    }
}
