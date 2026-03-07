using FluentValidation;

namespace UserService.Application.Features.Subscription.GetSubscription;

public class GetSubscriptionQueryValidator : AbstractValidator<GetSubscriptionQuery>
{
    public GetSubscriptionQueryValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("Идентификатор пользователя обязателен.");
    }
}
