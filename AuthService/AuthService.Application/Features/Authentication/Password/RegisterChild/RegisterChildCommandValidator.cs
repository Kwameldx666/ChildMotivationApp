using FluentValidation;

namespace AuthService.Application.Features.Authentication.Password.RegisterChild;

public class RegisterChildCommandValidator : AbstractValidator<RegisterChildCommand>
{
    public RegisterChildCommandValidator()
    {
        RuleFor(x => x.ParentEmail)
            .Cascade(CascadeMode.Stop)
            .NotEmpty()
            .EmailAddress();

        RuleFor(x => x.ParentPassword)
            .NotEmpty();

        RuleFor(x => x.ChildName)
            .NotEmpty()
            .MaximumLength(128);

        RuleFor(x => x.ChildLastName)
            .NotEmpty()
            .MaximumLength(128);

        RuleFor(x => x.ChildAge)
            .InclusiveBetween(0, 150);

        RuleFor(x => x.ChildAvatar)
            .MaximumLength(256)
            .When(x => !string.IsNullOrWhiteSpace(x.ChildAvatar));
    }
}
