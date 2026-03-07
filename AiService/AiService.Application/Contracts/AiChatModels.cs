using System.ComponentModel.DataAnnotations;

namespace AiService.Application.Contracts;

public sealed class AiChatRequest
{
    [Required(ErrorMessage = "Сообщение обязательно")]
    [StringLength(2000, ErrorMessage = "Сообщение не может превышать 2000 символов")]
    public string Message { get; init; } = string.Empty;

    [StringLength(64)]
    public string? ConversationId { get; init; }

    [MaxLength(50, ErrorMessage = "История не может содержать более 50 сообщений")]
    public IReadOnlyCollection<AiChatTurn> History { get; init; } = Array.Empty<AiChatTurn>();
    public IReadOnlyDictionary<string, string> Context { get; init; } = new Dictionary<string, string>();
}

public sealed record AiChatTurn(string Role, string Content, DateTimeOffset Timestamp);

public sealed record AiChatResponse(
    string ConversationId,
    string Reply,
    IReadOnlyCollection<string> FollowUpSuggestions,
    IReadOnlyCollection<AiAction> Actions,
    DateTimeOffset GeneratedAt);