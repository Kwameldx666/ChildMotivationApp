using MediatR;
using TaskService.Application.Abstractions;
using TaskService.Application.Dto.Tasks;
using TaskService.Application.Mappings;
using TaskService.Domain.Entities;
using TaskService.Domain.Repositories;

namespace TaskService.Application.Features.Tasks.Commands.CreateTask;

public class CreateTaskCommandHandler : IRequestHandler<CreateTaskCommand, TaskDto>
{
    private readonly ITaskRepository _repository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IDateTimeProvider _dateTimeProvider;
    private readonly INotificationClient _notificationClient;

    public CreateTaskCommandHandler(
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

    public async Task<TaskDto> Handle(CreateTaskCommand request, CancellationToken cancellationToken)
    {
        var task = TaskItem.Create(
            request.Title,
            request.Description,
            request.CreatedByUserId,
            _dateTimeProvider.UtcNow,
            request.EvidenceRequirement,
            request.Difficulty,
            request.AssignedToUserId);

        await _repository.AddAsync(task, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Notify the assigned child about the new task
        if (!string.IsNullOrEmpty(task.AssignedToUserId))
        {
            await _notificationClient.SendTaskAssignedNotificationAsync(
                task.Id.ToString(),
                task.Title,
                task.Description ?? "",
                task.AssignedToUserId,
                task.CreatedByUserId,
                cancellationToken);
        }

        return task.ToDto();
    }
}
