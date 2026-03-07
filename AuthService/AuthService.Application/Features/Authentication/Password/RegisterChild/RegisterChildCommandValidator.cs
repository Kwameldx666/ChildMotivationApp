using FluentValidation;

namespace AuthService.Application.Features.Authentication.Password.RegisterChild;

public class RegisterChildCommandValidator : AbstractValidator<RegisterChildCommand>
{
    public RegisterChildCommandValidator()
    {
        RuleFor(x => x.ParentId)
            .NotEmpty();

        RuleFor(x => x.ChildName)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Имя ребёнка обязательно.")
            .MinimumLength(2).WithMessage("Имя ребёнка должно содержать минимум 2 символа.")
            .MaximumLength(128)
            .Matches(@"^[\p{L}\s\-]+$").WithMessage("Имя может содержать только буквы, пробелы и дефисы.");

        RuleFor(x => x.ChildLastName)
            .MaximumLength(128)
            .Matches(@"^[\p{L}\s\-]+$").WithMessage("Фамилия может содержать только буквы, пробелы и дефисы.")
            .When(x => !string.IsNullOrWhiteSpace(x.ChildLastName));

        RuleFor(x => x.ChildAge)
            .InclusiveBetween(3, 18).WithMessage("Возраст ребёнка должен быть от 3 до 18 лет.");

        RuleFor(x => x.ChildAvatar)
            .MaximumLength(256)
            .When(x => !string.IsNullOrWhiteSpace(x.ChildAvatar));
    }
}
