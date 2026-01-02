namespace TaskService.Application.Dto.Missions;

public record MissionDto(
    Guid Id,
    string Title,
    string Description,
    string Icon,
    string Recurrence,
    int Progress,
    int Total,
    int RewardXp,
    bool Completed);
