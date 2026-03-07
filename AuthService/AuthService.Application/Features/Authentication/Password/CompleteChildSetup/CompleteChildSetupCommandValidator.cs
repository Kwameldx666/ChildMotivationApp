using FluentValidation;

namespace AuthService.Application.Features.Authentication.Password.CompleteChildSetup;

public class CompleteChildSetupCommandValidator : AbstractValidator<CompleteChildSetupCommand>
{
    public CompleteChildSetupCommandValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("Идентификатор пользователя обязателен.");

        RuleFor(x => x.CurrentPassword)
            .NotEmpty().WithMessage("Текущий пароль обязателен.")
            .MaximumLength(128);

        RuleFor(x => x.NewPassword)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Новый пароль обязателен.")
            .MinimumLength(8).WithMessage("Пароль должен содержать минимум 8 символов.")
            .MaximumLength(128)
            .Matches("[A-Z]").WithMessage("Пароль должен содержать хотя бы одну заглавную букву.")
            .Matches("[a-z]").WithMessage("Пароль должен содержать хотя бы одну строчную букву.")
            .Matches("[0-9]").WithMessage("Пароль должен содержать хотя бы одну цифру.")
            .NotEqual(x => x.CurrentPassword).WithMessage("Новый пароль не должен совпадать с текущим.");
    }
}
