using System.ComponentModel.DataAnnotations;

namespace TaskService.Api.Contracts.Achievements;

public class UpdateAchievementProgressRequest
{
    [Required]
    [StringLength(64)]
    public string UserId { get; init; } = string.Empty;

    [Range(1, 1000)]
    public int ProgressDelta { get; init; } = 1;
}
