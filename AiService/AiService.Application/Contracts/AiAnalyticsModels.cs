using System.ComponentModel.DataAnnotations;
using System.Diagnostics.CodeAnalysis;

namespace AiService.Application.Contracts;

[ExcludeFromCodeCoverage]
public sealed class AiAnalyticsRequest
{
    [Required(ErrorMessage = "ID пользователя обязателен")]
    [StringLength(64)]
    public string UserId { get; init; } = string.Empty;

    [StringLength(64)]
    public string? FamilyId { get; init; }

    [Range(1, 30, ErrorMessage = "Период должен быть от 1 до 30 дней")]
    public int? WindowDays { get; init; }

    [StringLength(16)]
    public string? Language { get; init; }

    [Range(1, 6, ErrorMessage = "Количество инсайтов должно быть от 1 до 6")]
    public int? MaxInsights { get; init; }

    public int ResolveWindow()
    {
        return Math.Clamp(WindowDays ?? 7, 1, 30);
    }

    public int ResolveLimit()
    {
        return Math.Clamp(MaxInsights ?? 3, 1, 6);
    }
}

[ExcludeFromCodeCoverage]
public sealed record AiInsightCard(
    string Type,
    string Title,
    string Message,
    string Severity,
    IReadOnlyCollection<string> Tags);

[ExcludeFromCodeCoverage]
public sealed record AiAnalyticsResponse(
    IReadOnlyCollection<AiInsightCard> Insights,
    IReadOnlyDictionary<string, string> Summary);