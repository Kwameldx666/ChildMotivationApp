using FluentValidation;
using FluentValidation.Results;
using MediatR;
using TaskService.Application.Abstractions;
using TaskService.Application.Common.Exceptions;
using TaskService.Domain.Repositories;

namespace TaskService.Application.Features.Tasks.Commands.CompleteTask;

public class CompleteTaskCommandHandler : IRequestHandler<CompleteTaskCommand>
{
    private readonly ITaskRepository _repository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IDateTimeProvider _dateTimeProvider;
    private readonly INotificationClient _notificationClient;

    public CompleteTaskCommandHandler(
        ITaskRepository repository,
        IUnitOfWork unitOfWork,
        IDateTimeProvider dateTimeProvider,
        INotificationClient notificationClient)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
        _dateTimeProvider = dateTimeProvider;
        _notificationClient = notificationClient;
    }

    public async Task<Unit> Handle(CompleteTaskCommand request, CancellationToken cancellationToken)
    {
        var task = await _repository.GetByIdAsync(request.Id, cancellationToken);
        if (task is null)
        {
            throw new NotFoundException(nameof(task), request.Id);
        }

        if (task.RequiresEvidence && !task.EvidenceSubmitted)
        {
            throw new ValidationException(new[]
            {
                new ValidationFailure("Evidence", "Для этой задачи требуется прикрепить подтверждение перед завершением.")
            });
        }

        task.SetCompletion(true, _dateTimeProvider.UtcNow);
        await _repository.UpdateAsync(task, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Send notifications to parent and child
        var userIds = new List<string> { task.CreatedByUserId }; // Parent
        if (!string.IsNullOrEmpty(task.AssignedToUserId) && task.AssignedToUserId != task.CreatedByUserId)
        {
            userIds.Add(task.AssignedToUserId); // Child
        }

        await _notificationClient.SendTaskCompletedNotificationAsync(
            task.Id.ToString(),
            task.Title,
            task.Description ?? "",
            userIds.ToArray(),
            cancellationToken);

        return Unit.Value;
    }
}
