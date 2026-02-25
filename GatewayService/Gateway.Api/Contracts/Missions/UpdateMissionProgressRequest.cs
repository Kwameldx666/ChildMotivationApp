using System.ComponentModel.DataAnnotations;

namespace Gateway.Contracts.Missions;

public class UpdateMissionProgressRequest
{
    [Range(1, 1000)] public int ProgressDelta { get; init; } = 1;
}