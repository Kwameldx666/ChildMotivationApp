namespace UserService.Application.Dto.FamilyChat;

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

public record SendMessageRequest(
    string Content,
    Guid? MentionedTaskId = null,
    string? ReplyToMessageId = null
);

public record MarkAsReadRequest(
    Guid MessageId
);
