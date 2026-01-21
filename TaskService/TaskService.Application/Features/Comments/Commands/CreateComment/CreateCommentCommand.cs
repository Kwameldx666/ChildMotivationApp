using MediatR;
using TaskService.Application.Dto.Comments;

namespace TaskService.Application.Features.Comments.Commands.CreateComment;

public record CreateCommentCommand(
    Guid TaskId,
    string UserId,
    string UserName,
    string UserRole,
    string Content
) : IRequest<TaskCommentDto>;
