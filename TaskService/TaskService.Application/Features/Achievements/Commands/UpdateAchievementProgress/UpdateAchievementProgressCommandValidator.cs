using FluentValidation;

namespace TaskService.Application.Features.Achievements.Commands.UpdateAchievementProgress;

public class UpdateAchievementProgressCommandValidator : AbstractValidator<UpdateAchievementProgressCommand>
{
    public UpdateAchievementProgressCommandValidator()
    {
        RuleFor(command => command.AchievementId).NotEmpty();
        RuleFor(command => command.UserId).NotEmpty();
        RuleFor(command => command.ProgressDelta).GreaterThan(0);
    }
}
