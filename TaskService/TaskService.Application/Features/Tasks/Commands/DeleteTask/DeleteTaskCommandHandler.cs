using MediatR;
using TaskService.Application.Abstractions;
using TaskService.Application.Common.Exceptions;
using TaskService.Domain.Repositories;

namespace TaskService.Application.Features.Tasks.Commands.DeleteTask;

public class DeleteTaskCommandHandler : IRequestHandler<DeleteTaskCommand>
{
    private readonly ITaskRepository _repository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly INotificationClient _notificationClient;

    public DeleteTaskCommandHandler(
        ITaskRepository repository,
        IUnitOfWork unitOfWork,
        INotificationClient notificationClient)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
        _notificationClient = notificationClient;
    }

    public async Task<Unit> Handle(DeleteTaskCommand request, CancellationToken cancellationToken)
    {
        var task = await _repository.GetByIdAsync(request.Id, cancellationToken);
        if (task is null)
        {
            throw new NotFoundException(nameof(task), request.Id);
        }

        await _repository.DeleteAsync(task, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var recipients = new[] { task.CreatedByUserId, task.AssignedToUserId }
            .Where(userId => !string.IsNullOrWhiteSpace(userId))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        foreach (var recipient in recipients)
        {
            await _notificationClient.SendGeneralNotificationAsync(
                recipient!,
                "Task Deleted",
                $"Task \"{task.Title}\" was deleted.",
                "task_deleted",
                new Dictionary<string, object>
                {
                    ["taskId"] = task.Id.ToString(),
                    ["taskTitle"] = task.Title,
                },
                cancellationToken);
        }

        return Unit.Value;
    }
}
