namespace AiService.Application.Contracts;

public sealed class RewardSuggestionsRequest
{
    public string? ChildId { get; init; }
    public IReadOnlyCollection<string> Interests { get; init; } = Array.Empty<string>();
    public int? AvailablePoints { get; init; }
    public string? Occasion { get; init; }
    public int? MaxSuggestions { get; init; }
    public IReadOnlyCollection<string> RecentlyPurchasedRewards { get; init; } = Array.Empty<string>();

    public int ResolveLimit() => Math.Clamp(MaxSuggestions ?? 4, 1, 8);
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
