using FluentValidation;
using AuthService.Domain.Enums;

namespace AuthService.Application.Features.Authentication.RegisterUser;

public class RegisterUserCommandValidator : AbstractValidator<RegisterUserCommand>
{
    private static readonly string[] AllowedRoles = Enum.GetNames<UserType>();

    public RegisterUserCommandValidator()
    {
        RuleFor(x => x.Email)
            .Cascade(CascadeMode.Stop)
            .NotEmpty()
            .EmailAddress();

        RuleFor(x => x.Password)
            .NotEmpty()
            .MinimumLength(6);

        RuleFor(x => x.Role)
            .Cascade(CascadeMode.Stop)
            .NotEmpty()
            .Must(BeValidRole)
            .WithMessage($"Role must be one of: {string.Join(", ", AllowedRoles)}.");

        RuleFor(x => x.Name)
            .NotEmpty()
            .MaximumLength(128);

        RuleFor(x => x.LastName)
            .NotEmpty()
            .MaximumLength(128);

        RuleFor(x => x.Avatar)
            .MaximumLength(256)
            .When(x => !string.IsNullOrWhiteSpace(x.Avatar));

        RuleFor(x => x.Age)
            .InclusiveBetween(0, 150)
            .When(x => x.Age.HasValue);

        RuleFor(x => x.Code)
            .MaximumLength(64)
            .When(x => !string.IsNullOrWhiteSpace(x.Code));

        RuleFor(x => x.FamilyName)
            .MaximumLength(128)
            .When(x => !string.IsNullOrWhiteSpace(x.FamilyName));

        RuleFor(x => x.Emblem)
            .MaximumLength(128)
            .When(x => !string.IsNullOrWhiteSpace(x.Emblem));
    }

    private static bool BeValidRole(string role)
    {
        return Enum.TryParse<UserType>(role.Trim(), true, out _);
    }
}