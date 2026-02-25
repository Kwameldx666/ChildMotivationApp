namespace AiService.Application.Contracts;

public sealed class TaskSuggestionsRequest
{
    public string? ChildId { get; init; }
    public int? ChildAge { get; init; }
    public string? Tone { get; init; }
    public string? Language { get; init; }
    public string? TaskDescription { get; init; }
    public int? SuggestionCount { get; init; }

    public int ResolveLimit()
    {
        // Honor explicit suggestion count if provided (clamp to reasonable range)
        if (SuggestionCount.HasValue) return Math.Clamp(SuggestionCount.Value, 1, 10);

        // If caller provided a concrete description, return a single focused suggestion.
        if (!string.IsNullOrWhiteSpace(TaskDescription)) return 1;

        // Fixed default limit for task suggestions
        return 5;
    }
} 

public sealed record TaskSuggestion(
    string Title,
    string Description,
    int Difficulty,
    IReadOnlyCollection<string> Tags,
    string Category,
    string ImpactSummary);

public sealed record TaskSuggestionsResponse(
    IReadOnlyCollection<TaskSuggestion> Suggestions,
    string StrategySummary,
    IReadOnlyCollection<string> Tips)
{
    public static TaskSuggestionsResponse Empty()
    {
        return new TaskSuggestionsResponse(Array.Empty<TaskSuggestion>(), "Not enough data for recommendations.",
            Array.Empty<string>());
    }
}