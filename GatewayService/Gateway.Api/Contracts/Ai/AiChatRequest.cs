using System.ComponentModel.DataAnnotations;

namespace Gateway.Api.Contracts.Ai;

public sealed class AiChatRequest
{
    [Required]
    [StringLength(2000)]
    public string Message { get; init; } = string.Empty;

    [StringLength(64)]
    public string? ConversationId { get; init; }

    public IReadOnlyCollection<AiChatHistoryEntry> History { get; init; } = Array.Empty<AiChatHistoryEntry>();

    public IReadOnlyDictionary<string, string> Context { get; init; } = new Dictionary<string, string>();
}

public sealed class AiChatHistoryEntry
{
    [Required]
    [StringLength(16)]
    public string Role { get; init; } = string.Empty;

    [Required]
    [StringLength(1000)]
    public string Content { get; init; } = string.Empty;

    public DateTimeOffset? Timestamp { get; init; }
}
