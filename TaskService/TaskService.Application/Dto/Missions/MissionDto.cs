using System.Diagnostics.CodeAnalysis;
namespace TaskService.Application.Dto.Missions;

[ExcludeFromCodeCoverage]

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


