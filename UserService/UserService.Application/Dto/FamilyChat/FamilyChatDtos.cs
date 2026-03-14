using System.Diagnostics.CodeAnalysis;
namespace UserService.Application.Dto.FamilyChat;

[ExcludeFromCodeCoverage]

public record FamilyMessageDto(
    Guid Id,
    string FamilyId,
    string SenderId,
    string SenderName,
    string SenderAvatar,
    string Content,
    DateTime CreatedAt,
    bool IsRead,
    Guid? MentionedTaskId,
    string? MentionedTaskTitle,
    string? ReplyToMessageId
);

[ExcludeFromCodeCoverage]

public record SendMessageRequest(
    string Content,
    Guid? MentionedTaskId = null,
    string? ReplyToMessageId = null
);

[ExcludeFromCodeCoverage]

public record MarkAsReadRequest(
    Guid MessageId
);


