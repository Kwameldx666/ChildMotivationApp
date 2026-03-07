using FluentValidation;

namespace TaskService.Application.Features.Missions.Queries.GetMissions;

public class GetMissionsQueryValidator : AbstractValidator<GetMissionsQuery>
{
    public GetMissionsQueryValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("Идентификатор пользователя обязателен.")
            .MaximumLength(64);

        RuleFor(x => x.Recurrence)
            .IsInEnum().WithMessage("Некорректный тип повторения миссии.")
            .When(x => x.Recurrence.HasValue);
    }
}
