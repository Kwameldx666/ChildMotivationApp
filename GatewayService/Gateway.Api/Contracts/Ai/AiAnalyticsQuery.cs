using System.ComponentModel.DataAnnotations;

namespace Gateway.Api.Contracts.Ai;

public sealed class AiAnalyticsQuery
{
    [StringLength(64)]
    public string? TargetUserId { get; init; }

    [StringLength(64)]
    public string? FamilyId { get; init; }

    [Range(1, 30)]
    public int? WindowDays { get; init; }

    [Range(1, 6)]
    public int? MaxInsights { get; init; }
}
