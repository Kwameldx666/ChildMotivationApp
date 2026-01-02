using MediatR;
using TaskService.Application.Dto.Achievements;

namespace TaskService.Application.Features.Achievements.Commands.UpdateAchievementProgress;

public record UpdateAchievementProgressCommand(Guid AchievementId, string UserId, int ProgressDelta) : IRequest<AchievementDto>;
