using System.ComponentModel.DataAnnotations;

namespace Gateway.Contracts.Ai;

public sealed class AiChatHistoryEntry
{
    [Required] [StringLength(16)] public string Role { get; init; } = string.Empty;

    [Required] [StringLength(1000)] public string Content { get; init; } = string.Empty;

    public DateTimeOffset? Timestamp { get; init; }
}