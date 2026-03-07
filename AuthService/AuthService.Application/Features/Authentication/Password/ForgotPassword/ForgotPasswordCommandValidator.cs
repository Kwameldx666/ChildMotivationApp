using FluentValidation;

namespace AuthService.Application.Features.Authentication.Password.ForgotPassword;

public class ForgotPasswordCommandValidator : AbstractValidator<ForgotPasswordCommand>
{
    public ForgotPasswordCommandValidator()
    {
        RuleFor(x => x.Email)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Email обязателен.")
            .MaximumLength(256)
            .EmailAddress().WithMessage("Некорректный формат email.");
    }
}
