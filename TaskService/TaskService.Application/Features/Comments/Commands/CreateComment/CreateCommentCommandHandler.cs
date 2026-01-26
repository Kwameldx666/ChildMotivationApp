using MediatR;
using TaskService.Application.Abstractions;
using TaskService.Application.Dto.Comments;
using TaskService.Domain.Entities;
using TaskService.Domain.Repositories;

namespace TaskService.Application.Features.Comments.Commands.CreateComment;

public class CreateCommentCommandHandler : IRequestHandler<CreateCommentCommand, TaskCommentDto>
{
    private readonly ITaskCommentRepository _commentRepository;
    private readonly ITaskRepository _taskRepository;
    private readonly INotificationClient _notificationClient;

    public CreateCommentCommandHandler(
        ITaskCommentRepository commentRepository,
        ITaskRepository taskRepository,
        INotificationClient notificationClient)
    {
        _commentRepository = commentRepository;
        _taskRepository = taskRepository;
        _notificationClient = notificationClient;
    }

    public async Task<TaskCommentDto> Handle(CreateCommentCommand request, CancellationToken cancellationToken)
    {
        // Verify task exists
        var task = await _taskRepository.GetByIdAsync(request.TaskId, cancellationToken);
        if (task == null)
        {
            throw new InvalidOperationException($"Task with ID {request.TaskId} not found");
        }

        var comment = TaskComment.Create(
            request.TaskId,
            request.UserId,
            request.UserName,
            request.UserRole,
            request.Content
        );

        var created = await _commentRepository.AddAsync(comment, cancellationToken);

        // Send notifications to other users involved in the task
        var userIds = new List<string> { task.CreatedByUserId }; // Parent
        if (!string.IsNullOrEmpty(task.AssignedToUserId) && task.AssignedToUserId != task.CreatedByUserId)
        {
            userIds.Add(task.AssignedToUserId); // Child
        }
        // Remove the comment author from notification recipients
        userIds = userIds.Where(id => id != request.UserId).ToList();

        if (userIds.Any())
        {
            await _notificationClient.SendNewCommentNotificationAsync(
                task.Id.ToString(),
                task.Title,
                request.UserName,
                userIds.ToArray(),
                cancellationToken);
        }

        return new TaskCommentDto(
            created.Id,
            created.TaskId,
            created.UserId,
            created.UserName,
            created.UserRole,
            created.Content,
            created.CreatedAt,
            created.UpdatedAt,
            created.IsEdited
        );
    }
}
