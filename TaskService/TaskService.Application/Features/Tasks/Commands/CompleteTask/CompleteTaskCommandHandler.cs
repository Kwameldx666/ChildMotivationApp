using FluentValidation;
using FluentValidation.Results;
using MediatR;
using TaskService.Application.Abstractions;
using TaskService.Application.Common.Exceptions;
using TaskService.Application.Features.Tasks.Commands;
using TaskService.Domain.Repositories;

namespace TaskService.Application.Features.Tasks.Commands.CompleteTask;

public class CompleteTaskCommandHandler : IRequestHandler<CompleteTaskCommand>
{
    private readonly ITaskRepository _repository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IDateTimeProvider _dateTimeProvider;
    private readonly INotificationClient _notificationClient;
    private readonly IMissionRepository _missionRepository;
    private readonly IMissionProgressRepository _missionProgressRepository;
    private readonly IAchievementRepository _achievementRepository;
    private readonly IAchievementProgressRepository _achievementProgressRepository;

    public CompleteTaskCommandHandler(
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
                new ValidationFailure("Evidence", "This task requires attaching confirmation before completion.")
            });
        }

        var wasCompleted = task.Completed;
        var completedAt = _dateTimeProvider.UtcNow;

        task.SetCompletion(true, completedAt);
        await _repository.UpdateAsync(task, cancellationToken);

        if (!wasCompleted)
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

        // Completion/update alerts should be delivered to the child assignee.
        var userIds = new[] { task.AssignedToUserId }
            .Where(userId => !string.IsNullOrWhiteSpace(userId))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        if (userIds.Length > 0)
        {
            await _notificationClient.SendTaskCompletedNotificationAsync(
                task.Id.ToString(),
                task.Title,
                task.Description ?? "",
                userIds,
                cancellationToken);
        }

        return Unit.Value;
    }
}
