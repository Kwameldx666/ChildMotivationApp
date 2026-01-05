using System.ComponentModel.DataAnnotations;

namespace Gateway.Contracts.Ai;

public sealed class AiRewardSuggestionsRequest
{
    [StringLength(64)] public string? ChildId { get; init; }

    [MaxLength(10)] public IReadOnlyCollection<string> Interests { get; init; } = Array.Empty<string>();

    [Range(50, 2000)] public int? AvailablePoints { get; init; }

    [StringLength(64)] public string? Occasion { get; init; }

    [Range(1, 8)] public int? MaxSuggestions { get; init; }

    [MaxLength(10)] public IReadOnlyCollection<string> RecentlyPurchasedRewards { get; init; } = Array.Empty<string>();
}