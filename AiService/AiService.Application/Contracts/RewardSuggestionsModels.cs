using System.ComponentModel.DataAnnotations;

namespace AiService.Application.Contracts;

public sealed class RewardSuggestionsRequest
{
    [StringLength(64)]
    public string? ChildId { get; init; }

    [MaxLength(10, ErrorMessage = "Можно указать не более 10 интересов")]
    public IReadOnlyCollection<string> Interests { get; init; } = Array.Empty<string>();

    [Range(1, 100000, ErrorMessage = "Количество баллов должно быть от 1 до 100000")]
    public int? AvailablePoints { get; init; }

    [StringLength(64)]
    public string? Occasion { get; init; }

    [StringLength(16)]
    public string? Language { get; init; }

    [Range(1, 8, ErrorMessage = "Количество предложений должно быть от 1 до 8")]
    public int? MaxSuggestions { get; init; }

    [MaxLength(10, ErrorMessage = "Можно указать не более 10 недавних наград")]
    public IReadOnlyCollection<string> RecentlyPurchasedRewards { get; init; } = Array.Empty<string>();

    public int ResolveLimit()
    {
        return Math.Clamp(MaxSuggestions ?? 4, 1, 8);
    }
}

public sealed record RewardSuggestion(
    string Title,
    string Description,
    int Cost,
    string Category,
    string Icon,
    string MotivationHint);

public sealed record RewardSuggestionsResponse(
    IReadOnlyCollection<RewardSuggestion> Suggestions,
    string BudgetSummary);