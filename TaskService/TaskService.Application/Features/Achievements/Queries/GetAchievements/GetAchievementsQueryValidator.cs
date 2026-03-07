using FluentValidation;

namespace TaskService.Application.Features.Achievements.Queries.GetAchievements;

public class GetAchievementsQueryValidator : AbstractValidator<GetAchievementsQuery>
{
    public GetAchievementsQueryValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("Идентификатор пользователя обязателен.")
            .MaximumLength(64);
    }
}
