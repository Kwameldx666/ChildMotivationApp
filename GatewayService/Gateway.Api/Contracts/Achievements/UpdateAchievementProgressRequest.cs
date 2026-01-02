using System.ComponentModel.DataAnnotations;

namespace Gateway.Api.Contracts.Achievements;

public class UpdateAchievementProgressRequest
{
    [Range(1, 1000)]
    public int ProgressDelta { get; init; } = 1;
}
