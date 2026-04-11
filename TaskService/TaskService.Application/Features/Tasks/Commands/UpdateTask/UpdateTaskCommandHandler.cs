using MediatR;
using TaskService.Application.Abstractions;
using TaskService.Application.Common.Exceptions;
using TaskService.Application.Dto.Tasks;
using TaskService.Application.Mappings;
using TaskService.Domain.Repositories;

namespace TaskService.Application.Features.Tasks.Commands.UpdateTask;

public class UpdateTaskCommandHandler : IRequestHandler<UpdateTaskCommand, TaskDto>
{
    private readonly ITaskRepository _repository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IDateTimeProvider _dateTimeProvider;
    private readonly INotificationClient _notificationClient;

    public UpdateTaskCommandHandler(
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

    public async Task<TaskDto> Handle(UpdateTaskCommand request, CancellationToken cancellationToken)
    {
        var task = await _repository.GetByIdAsync(request.Id, cancellationToken);
        if (task is null)
        {
            throw new NotFoundException(nameof(task), request.Id);
        }

        task.UpdateDetails(request.Title, request.Description);
        if (request.EvidenceRequirement.HasValue)
        {
            task.UpdateEvidenceRequirement(request.EvidenceRequirement.Value);
        }

        if (request.Difficulty.HasValue)
        {
            task.UpdateDifficulty(request.Difficulty.Value);
        }

        if (request.Completed.HasValue)
        {
            task.SetCompletion(request.Completed.Value, _dateTimeProvider.UtcNow);
        }

        await _repository.UpdateAsync(task, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var recipients = string.IsNullOrWhiteSpace(task.AssignedToUserId)
            ? Array.Empty<string>()
            : new[] { task.AssignedToUserId! };

        if (recipients.Length > 0)
        {
            var status = task.Completed ? "Completed" : "Updated";
            await _notificationClient.SendTaskUpdatedNotificationAsync(
                task.Id.ToString(),
                task.Title,
                task.Description ?? string.Empty,
                recipients,
                status,
                cancellationToken);
        }

        return task.ToDto();
    }
}
