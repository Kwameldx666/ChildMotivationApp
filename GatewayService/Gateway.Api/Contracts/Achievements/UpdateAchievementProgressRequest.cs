using System.Diagnostics.CodeAnalysis;
using System.ComponentModel.DataAnnotations;

namespace Gateway.Contracts.Achievements;

[ExcludeFromCodeCoverage]

public class UpdateAchievementProgressRequest
{
    [Range(1, 1000)] public int ProgressDelta { get; init; } = 1;
}

