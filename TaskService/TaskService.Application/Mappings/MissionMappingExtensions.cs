using TaskService.Application.Dto.Missions;
using TaskService.Domain.Entities;

namespace TaskService.Application.Mappings;

public static class MissionMappingExtensions
{
    public static MissionDto ToDto(this Mission mission, MissionProgress? progress)
    {
        if (mission is null) throw new ArgumentNullException(nameof(mission));

        return new MissionDto(
            mission.Id,
            mission.Title,
            mission.Description,
            mission.Icon,
            mission.Recurrence.ToString().ToLowerInvariant(),
            progress?.ProgressValue ?? 0,
            mission.TargetValue,
            mission.RewardXp,
            progress?.IsCompleted ?? false);
    }
}
