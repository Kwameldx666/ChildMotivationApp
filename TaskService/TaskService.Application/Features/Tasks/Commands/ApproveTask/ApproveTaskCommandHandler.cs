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
        var userIds = new List<string>();
        if (!string.IsNullOrEmpty(task.AssignedToUserId))
            userIds.Add(task.AssignedToUserId);
        if (!string.IsNullOrEmpty(task.CreatedByUserId))
            userIds.Add(task.CreatedByUserId);

        if (userIds.Count > 0)
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
