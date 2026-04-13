using System.Linq;
using MediatR;
using TaskService.Application.Dto.Achievements;
using TaskService.Application.Mappings;
using TaskService.Domain.Repositories;

namespace TaskService.Application.Features.Achievements.Queries.GetAchievements;

public class GetAchievementsQueryHandler : IRequestHandler<GetAchievementsQuery, IReadOnlyList<AchievementDto>>
{
    private readonly IAchievementRepository _achievementRepository;
    private readonly IAchievementProgressRepository _progressRepository;

    public GetAchievementsQueryHandler(
        IAchievementRepository achievementRepository,
        IAchievementProgressRepository progressRepository)
    {
        _achievementRepository = achievementRepository;
        _progressRepository = progressRepository;
    }

    public async Task<IReadOnlyList<AchievementDto>> Handle(GetAchievementsQuery request, CancellationToken cancellationToken)
    {
        var normalizedUserId = NormalizeUserId(request.UserId);
        if (string.IsNullOrWhiteSpace(normalizedUserId))
        {
            return Array.Empty<AchievementDto>();
        }

        var achievements = await _achievementRepository.GetActiveAsync(cancellationToken);
        if (achievements.Count == 0)
        {
            return Array.Empty<AchievementDto>();
        }

        var achievementIds = achievements.Select(a => a.Id).ToArray();
        var progressItems = await _progressRepository.GetByUserAsync(normalizedUserId, achievementIds, cancellationToken);
        var progressLookup = progressItems.ToDictionary(p => p.AchievementId);

        var result = achievements
            .OrderBy(achievement => achievement.SortOrder)
            .ThenBy(achievement => achievement.CreatedAt)
            .Select(achievement =>
            {
                progressLookup.TryGetValue(achievement.Id, out var progress);
                return achievement.ToDto(progress);
            })
            .ToList();

        return result;
    }

    private static string NormalizeUserId(string userId)
    {
        return userId?.Trim().ToLowerInvariant() ?? string.Empty;
    }
}
