using FluentValidation;
using UserService.Domain.Enums;

namespace UserService.Application.Features.Subscription.ChangeSubscription;

public class ChangeSubscriptionCommandValidator : AbstractValidator<ChangeSubscriptionCommand>
{
    public ChangeSubscriptionCommandValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("Идентификатор пользователя обязателен.");

        RuleFor(x => x.NewTier)
            .IsInEnum().WithMessage("Некорректный тариф подписки.");
    }
}
