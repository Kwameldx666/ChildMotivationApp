using System.ComponentModel.DataAnnotations;

namespace Gateway.Contracts.Ai;

public sealed class AiTaskSuggestionsRequest
{
    [StringLength(64)] public string? ChildId { get; init; }

    [Range(4, 18, ErrorMessage = "Возраст указывается в диапазоне 4-18 лет.")]
    public int? ChildAge { get; init; }

    [MaxLength(10)] public IReadOnlyCollection<string> Interests { get; init; } = Array.Empty<string>();

    [MaxLength(10)] public IReadOnlyCollection<string> Goals { get; init; } = Array.Empty<string>();

    [MaxLength(10)] public IReadOnlyCollection<string> RecentTasks { get; init; } = Array.Empty<string>();

    [Range(1, 10)] public int? MaxSuggestions { get; init; }

    [StringLength(32)] public string? Tone { get; init; }

    [StringLength(16)] public string? Language { get; init; }
}