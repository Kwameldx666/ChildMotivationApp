using MediatR;
using TaskService.Application.Abstractions;
using TaskService.Application.Common.Exceptions;
using TaskService.Domain.Repositories;

namespace TaskService.Application.Features.Tasks.Commands.StartTask;

public class StartTaskCommandHandler(
    ITaskRepository repository,
    IUnitOfWork unitOfWork,
    IDateTimeProvider dateTimeProvider,
    INotificationClient notificationClient) : IRequestHandler<StartTaskCommand>
{
    public async Task<Unit> Handle(StartTaskCommand request, CancellationToken cancellationToken)
    {
        var task = await repository.GetByIdAsync(request.Id, cancellationToken);
        if (task is null)
            throw new NotFoundException(nameof(task), request.Id);

        task.MarkInProgress(dateTimeProvider.UtcNow);
        await repository.UpdateAsync(task, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        if (!string.IsNullOrWhiteSpace(task.CreatedByUserId))
        {
            await notificationClient.SendTaskUpdatedNotificationAsync(
                task.Id.ToString(),
                task.Title,
                task.Description ?? string.Empty,
                [task.CreatedByUserId],
                "InProgress",
                cancellationToken);
        }

        return Unit.Value;
    }
}
