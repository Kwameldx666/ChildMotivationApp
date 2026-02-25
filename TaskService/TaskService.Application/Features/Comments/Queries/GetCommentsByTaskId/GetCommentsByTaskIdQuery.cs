using MediatR;
using TaskService.Application.Dto.Comments;

namespace TaskService.Application.Features.Comments.Queries.GetCommentsByTaskId;

public record GetCommentsByTaskIdQuery(Guid TaskId) : IRequest<IReadOnlyList<TaskCommentDto>>;
