using System.Diagnostics.CodeAnalysis;
using System.ComponentModel.DataAnnotations;

namespace TaskService.Api.Contracts.Missions;

[ExcludeFromCodeCoverage]

public class UpdateMissionProgressRequest
{
    [Required]
    [StringLength(64)]
    public string UserId { get; init; } = string.Empty;

    [Range(1, 1000)]
    public int ProgressDelta { get; init; } = 1;
}


