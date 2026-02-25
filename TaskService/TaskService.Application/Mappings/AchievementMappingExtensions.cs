using TaskService.Application.Dto.Achievements;
using TaskService.Domain.Entities;

namespace TaskService.Application.Mappings;

public static class AchievementMappingExtensions
{
    public static AchievementDto ToDto(this Achievement achievement, AchievementProgress? progress)
    {
        if (achievement is null) throw new ArgumentNullException(nameof(achievement));

        return new AchievementDto(
            achievement.Id,
            achievement.Title,
            achievement.Description,
            achievement.Icon,
            progress?.ProgressValue ?? 0,
            achievement.TargetValue,
            progress?.IsUnlocked ?? false,
            achievement.RewardXp);
    }
}
