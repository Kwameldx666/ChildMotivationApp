using System.Diagnostics.CodeAnalysis;
namespace TaskService.Application.Dto.Comments;

[ExcludeFromCodeCoverage]

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


