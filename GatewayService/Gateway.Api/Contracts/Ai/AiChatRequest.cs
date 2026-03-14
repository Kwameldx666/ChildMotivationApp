using System.Diagnostics.CodeAnalysis;
using System.ComponentModel.DataAnnotations;

namespace Gateway.Contracts.Ai;

[ExcludeFromCodeCoverage]

public sealed class AiChatRequest
{
    [Required] [StringLength(2000)] public string Message { get; init; } = string.Empty;

    [StringLength(64)] public string? ConversationId { get; init; }

    public IReadOnlyCollection<AiChatHistoryEntry> History { get; init; } = Array.Empty<AiChatHistoryEntry>();

    public IReadOnlyDictionary<string, string> Context { get; init; } = new Dictionary<string, string>();
}

