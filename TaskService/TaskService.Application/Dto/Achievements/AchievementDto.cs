using System.Diagnostics.CodeAnalysis;
namespace TaskService.Application.Dto.Achievements;

[ExcludeFromCodeCoverage]

public record AchievementDto(
    Guid Id,
    string Title,
    string Description,
    string Icon,
    int Progress,
    int Total,
    bool Unlocked,
    int RewardXp);


