namespace AiService.Application.Contracts;

public sealed class AiAnalyticsRequest
{
    public string UserId { get; init; } = string.Empty;
    public string? FamilyId { get; init; }
    public int? WindowDays { get; init; }
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

public sealed record AiInsightCard(
    string Type,
    string Title,
    string Message,
    string Severity,
    IReadOnlyCollection<string> Tags);

public sealed record AiAnalyticsResponse(
    IReadOnlyCollection<AiInsightCard> Insights,
    IReadOnlyDictionary<string, string> Summary);