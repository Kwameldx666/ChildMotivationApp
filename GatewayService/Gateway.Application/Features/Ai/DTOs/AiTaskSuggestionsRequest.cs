using System.ComponentModel.DataAnnotations;

namespace Gateway.Application.Features.Ai.DTOs;

public sealed class AiTaskSuggestionsRequest
{
    [StringLength(64)] public string? ChildId { get; init; }

    [Range(4, 18, ErrorMessage = "Age must be in the range of 4-18 years.")]
    public int? ChildAge { get; init; }

    [StringLength(32)] public string? Tone { get; init; }

    [StringLength(16)] public string? Language { get; init; }

    [StringLength(1000)] public string? TaskDescription { get; init; }

    [Range(1, 10)] public int? SuggestionCount { get; init; }
}