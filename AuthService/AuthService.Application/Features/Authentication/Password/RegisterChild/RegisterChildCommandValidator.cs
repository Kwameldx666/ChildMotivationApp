using FluentValidation;

namespace AuthService.Application.Features.Authentication.Password.RegisterChild;

public class RegisterChildCommandValidator : AbstractValidator<RegisterChildCommand>
{
    public RegisterChildCommandValidator()
    {
        RuleFor(x => x.ParentId)
            .NotEmpty();

        RuleFor(x => x.ChildName)
            .NotEmpty()
            .MaximumLength(128);

        RuleFor(x => x.ChildLastName)
            .MaximumLength(128)
            .When(x => !string.IsNullOrWhiteSpace(x.ChildLastName));

        RuleFor(x => x.ChildAge)
            .InclusiveBetween(3, 18);

        RuleFor(x => x.ChildAvatar)
            .MaximumLength(256)
            .When(x => !string.IsNullOrWhiteSpace(x.ChildAvatar));
    }
}
