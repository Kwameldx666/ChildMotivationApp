using FluentValidation;

namespace TaskService.Application.Features.Missions.Commands.UpdateMissionProgress;

public class UpdateMissionProgressCommandValidator : AbstractValidator<UpdateMissionProgressCommand>
{
    public UpdateMissionProgressCommandValidator()
    {
        RuleFor(command => command.MissionId).NotEmpty();
        RuleFor(command => command.UserId).NotEmpty();
        RuleFor(command => command.ProgressDelta).GreaterThan(0);
    }
}
