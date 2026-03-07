using System.ComponentModel.DataAnnotations;

namespace AiService.Application.Contracts;

public sealed class TaskSuggestionsRequest
{
    [StringLength(64)]
    public string? ChildId { get; init; }

    [Range(3, 18, ErrorMessage = "Возраст ребёнка должен быть от 3 до 18")]
    public int? ChildAge { get; init; }

    [StringLength(32)]
    public string? Tone { get; init; }

    [StringLength(16)]
    public string? Language { get; init; }

    [StringLength(1000, ErrorMessage = "Описание задачи не может превышать 1000 символов")]
    public string? TaskDescription { get; init; }

    [Range(1, 10, ErrorMessage = "Количество предложений должно быть от 1 до 10")]
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