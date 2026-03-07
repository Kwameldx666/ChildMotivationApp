using FluentValidation;

namespace TaskService.Application.Features.Analytics.Queries.GetAnalytics;

public class GetAnalyticsQueryValidator : AbstractValidator<GetAnalyticsQuery>
{
    public GetAnalyticsQueryValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("Идентификатор пользователя обязателен.")
            .MaximumLength(64);

        RuleFor(x => x.WindowDays)
            .InclusiveBetween(1, 365).WithMessage("Период аналитики должен быть от 1 до 365 дней.");
    }
}
