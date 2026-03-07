using FluentValidation;

namespace AuthService.Application.Features.Authentication.Password.ResetChildPassword;

public class ResetChildPasswordCommandValidator : AbstractValidator<ResetChildPasswordCommand>
{
    public ResetChildPasswordCommandValidator()
    {
        RuleFor(x => x.ParentId)
            .NotEmpty().WithMessage("Идентификатор родителя обязателен.");

        RuleFor(x => x.ChildId)
            .NotEmpty().WithMessage("Идентификатор ребёнка обязателен.");
    }
}
