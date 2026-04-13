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

        var occurredAt = dateTimeProvider.UtcNow;
        task.AssignToUserIfUnassigned(NormalizeUserId(request.ActingUserId), occurredAt);
        task.MarkInProgress(occurredAt);
        await repository.UpdateAsync(task, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        if (!string.IsNullOrWhiteSpace(task.AssignedToUserId))
        {
            await notificationClient.SendTaskUpdatedNotificationAsync(
                task.Id.ToString(),
                task.Title,
                task.Description ?? string.Empty,
                [task.AssignedToUserId!],
                "InProgress",
                cancellationToken);
        }

        return Unit.Value;
    }

    private static string? NormalizeUserId(string? userId)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            return null;
        }

        return userId.Trim().ToLowerInvariant();
    }
}
