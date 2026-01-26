using MediatR;
using TaskService.Application.Dto.Comments;
using TaskService.Domain.Repositories;

namespace TaskService.Application.Features.Comments.Queries.GetCommentsByTaskId;

public class GetCommentsByTaskIdQueryHandler : IRequestHandler<GetCommentsByTaskIdQuery, IReadOnlyList<TaskCommentDto>>
{
    private readonly ITaskCommentRepository _commentRepository;

    public GetCommentsByTaskIdQueryHandler(ITaskCommentRepository commentRepository)
    {
        _commentRepository = commentRepository;
    }

    public async Task<IReadOnlyList<TaskCommentDto>> Handle(GetCommentsByTaskIdQuery request, CancellationToken cancellationToken)
    {
        var comments = await _commentRepository.GetByTaskIdAsync(request.TaskId, cancellationToken);
        
        return comments.Select(c => new TaskCommentDto(
            c.Id,
            c.TaskId,
            c.UserId,
            c.UserName,
            c.UserRole,
            c.Content,
            c.CreatedAt,
            c.UpdatedAt,
            c.IsEdited
        )).ToList();
    }
}
