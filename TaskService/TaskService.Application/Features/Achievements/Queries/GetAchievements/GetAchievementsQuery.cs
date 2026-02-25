using MediatR;
using TaskService.Application.Dto.Achievements;

namespace TaskService.Application.Features.Achievements.Queries.GetAchievements;

public record GetAchievementsQuery(string UserId) : IRequest<IReadOnlyList<AchievementDto>>;
