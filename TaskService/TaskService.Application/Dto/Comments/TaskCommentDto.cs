namespace TaskService.Application.Dto.Comments;

public record TaskCommentDto(
    Guid Id,
    Guid TaskId,
    string UserId,
    string UserName,
    string UserRole,
    string Content,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    bool IsEdited
);
