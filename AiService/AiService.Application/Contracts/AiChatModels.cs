namespace AiService.Application.Contracts;

public sealed class AiChatRequest
{
    public string Message { get; init; } = string.Empty;
    public string? ConversationId { get; init; }
    public IReadOnlyCollection<AiChatTurn> History { get; init; } = Array.Empty<AiChatTurn>();
    public IReadOnlyDictionary<string, string> Context { get; init; } = new Dictionary<string, string>();
}

public sealed record AiChatTurn(string Role, string Content, DateTimeOffset Timestamp);

public sealed record AiChatResponse(
    string ConversationId,
    string Reply,
    IReadOnlyCollection<string> FollowUpSuggestions,
    DateTimeOffset GeneratedAt);
