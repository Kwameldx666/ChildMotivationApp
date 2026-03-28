using MediatR;
using TaskService.Application.Abstractions;
using TaskService.Application.Common.Exceptions;
using TaskService.Domain.Repositories;

namespace TaskService.Application.Features.Tasks.Commands.RequestApproval;

public class RequestApprovalCommandHandler(
    ITaskRepository repository,
    IUnitOfWork unitOfWork,
    IDateTimeProvider dateTimeProvider,
    INotificationClient notificationClient) : IRequestHandler<RequestApprovalCommand>
{
    public async Task<Unit> Handle(RequestApprovalCommand request, CancellationToken cancellationToken)
    {
        var task = await repository.GetByIdAsync(request.Id, cancellationToken);
        if (task is null)
            throw new NotFoundException(nameof(task), request.Id);

        if (task.RequiresEvidence && !task.EvidenceSubmitted)
            throw new FluentValidation.ValidationException(
            [
                new("Evidence", "This task requires attaching confirmation before requesting approval.")
            ]);

        task.RequestApproval(dateTimeProvider.UtcNow);
        await repository.UpdateAsync(task, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        // Notify the parent that child requests approval
        if (!string.IsNullOrEmpty(task.CreatedByUserId))
        {
            await notificationClient.SendTaskUpdatedNotificationAsync(
                task.Id.ToString(),
                task.Title,
                task.Description ?? "",
                [task.CreatedByUserId],
                "PendingApproval",
                cancellationToken);
        }

        return Unit.Value;
    }
}
