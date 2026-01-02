using System.Collections.ObjectModel;

namespace AiService.Application.Contracts;

public sealed class TaskSuggestionsRequest
{
    public string? ChildId { get; init; }
    public int? ChildAge { get; init; }
    public IReadOnlyCollection<string> Interests { get; init; } = Array.Empty<string>();
    public IReadOnlyCollection<string> Goals { get; init; } = Array.Empty<string>();
    public IReadOnlyCollection<string> RecentTasks { get; init; } = Array.Empty<string>();
    public int? MaxSuggestions { get; init; }
    public string? Tone { get; init; }
    public string? Language { get; init; }

    public int ResolveLimit() => Math.Clamp(MaxSuggestions ?? 5, 1, 10);
}

public sealed record TaskSuggestion(
    string Title,
    string Description,
    int Difficulty,
    int RewardXp,
    int RewardPoints,
    IReadOnlyCollection<string> Tags,
    string Category,
    string ImpactSummary);

public sealed record TaskSuggestionsResponse(
    IReadOnlyCollection<TaskSuggestion> Suggestions,
    string StrategySummary,
    IReadOnlyCollection<string> Tips)
{
    public static TaskSuggestionsResponse Empty()
        => new TaskSuggestionsResponse(Array.Empty<TaskSuggestion>(), "Недостаточно данных для рекомендаций.", Array.Empty<string>());
}
