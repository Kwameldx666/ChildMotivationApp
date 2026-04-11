using MediatR;
using TaskService.Application.Abstractions;
using TaskService.Application.Common.Exceptions;
using TaskService.Domain.Repositories;

namespace TaskService.Application.Features.Tasks.Commands.ApproveTask;

public class ApproveTaskCommandHandler(
    ITaskRepository repository,
    IUnitOfWork unitOfWork,
    IDateTimeProvider dateTimeProvider,
    INotificationClient notificationClient) : IRequestHandler<ApproveTaskCommand>
{
    public async Task<Unit> Handle(ApproveTaskCommand request, CancellationToken cancellationToken)
    {
        var task = await repository.GetByIdAsync(request.Id, cancellationToken);
        if (task is null)
            throw new NotFoundException(nameof(task), request.Id);

        task.SetCompletion(true, dateTimeProvider.UtcNow);
        await repository.UpdateAsync(task, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        // Notify child that parent approved
        var userIds = new[] { task.AssignedToUserId }
            .Where(userId => !string.IsNullOrWhiteSpace(userId))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        if (userIds.Length > 0)
        {
            await notificationClient.SendTaskCompletedNotificationAsync(
                task.Id.ToString(),
                task.Title,
                task.Description ?? "",
                userIds.ToArray(),
                cancellationToken);
        }

        return Unit.Value;
    }
}
