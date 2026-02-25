namespace TaskService.Application.Dto.Achievements;

public record AchievementDto(
    Guid Id,
    string Title,
    string Description,
    string Icon,
    int Progress,
    int Total,
    bool Unlocked,
    int RewardXp);
