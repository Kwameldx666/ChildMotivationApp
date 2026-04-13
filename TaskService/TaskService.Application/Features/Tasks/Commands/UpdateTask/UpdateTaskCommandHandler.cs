using MediatR;
using TaskService.Application.Abstractions;
using TaskService.Application.Common.Exceptions;
using TaskService.Application.Dto.Tasks;
using TaskService.Application.Mappings;
using TaskService.Application.Features.Tasks.Commands;
using TaskService.Domain.Repositories;

namespace TaskService.Application.Features.Tasks.Commands.UpdateTask;

public class UpdateTaskCommandHandler : IRequestHandler<UpdateTaskCommand, TaskDto>
{
    private readonly ITaskRepository _repository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IDateTimeProvider _dateTimeProvider;
    private readonly INotificationClient _notificationClient;
    private readonly IMissionRepository _missionRepository;
    private readonly IMissionProgressRepository _missionProgressRepository;
    private readonly IAchievementRepository _achievementRepository;
    private readonly IAchievementProgressRepository _achievementProgressRepository;

    public UpdateTaskCommandHandler(
        ITaskRepository repository,
        IUnitOfWork unitOfWork,
        IDateTimeProvider dateTimeProvider,
        INotificationClient notificationClient,
        IMissionRepository missionRepository,
        IMissionProgressRepository missionProgressRepository,
        IAchievementRepository achievementRepository,
        IAchievementProgressRepository achievementProgressRepository)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
        _dateTimeProvider = dateTimeProvider;
        _notificationClient = notificationClient;
        _missionRepository = missionRepository;
        _missionProgressRepository = missionProgressRepository;
        _achievementRepository = achievementRepository;
        _achievementProgressRepository = achievementProgressRepository;
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

        var wasCompleted = task.Completed;
        var completedAt = _dateTimeProvider.UtcNow;
        if (request.Completed.HasValue)
        {
            task.SetCompletion(request.Completed.Value, completedAt);
        }
        var completedNow = !wasCompleted && task.Completed;

        await _repository.UpdateAsync(task, cancellationToken);

        if (completedNow)
        {
            var progressUserId = string.IsNullOrWhiteSpace(task.AssignedToUserId)
                ? task.CreatedByUserId
                : task.AssignedToUserId!;

            await TaskCompletionProgressUpdater.ApplyAsync(
                task,
                progressUserId,
                completedAt,
                _missionRepository,
                _missionProgressRepository,
                _achievementRepository,
                _achievementProgressRepository,
                cancellationToken);
        }

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
