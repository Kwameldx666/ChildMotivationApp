using MediatR;
using TaskService.Application.Abstractions;
using TaskService.Application.Common.Exceptions;
using TaskService.Application.Dto.Missions;
using TaskService.Application.Mappings;
using TaskService.Domain.Entities;
using TaskService.Domain.Repositories;
using TaskService.Domain.ValueObjects;

namespace TaskService.Application.Features.Missions.Commands.UpdateMissionProgress;

public class UpdateMissionProgressCommandHandler : IRequestHandler<UpdateMissionProgressCommand, MissionDto>
{
    private readonly IMissionRepository _missionRepository;
    private readonly IMissionProgressRepository _progressRepository;
    private readonly IDateTimeProvider _dateTimeProvider;
    private readonly IUnitOfWork _unitOfWork;

    public UpdateMissionProgressCommandHandler(
        IMissionRepository missionRepository,
        IMissionProgressRepository progressRepository,
        IDateTimeProvider dateTimeProvider,
        IUnitOfWork unitOfWork)
    {
        _missionRepository = missionRepository;
        _progressRepository = progressRepository;
        _dateTimeProvider = dateTimeProvider;
        _unitOfWork = unitOfWork;
    }

    public async Task<MissionDto> Handle(UpdateMissionProgressCommand request, CancellationToken cancellationToken)
    {
        if (request.MissionId == Guid.Empty)
        {
            throw new ArgumentException("Mission identifier is required", nameof(request.MissionId));
        }

        if (string.IsNullOrWhiteSpace(request.UserId))
        {
            throw new ArgumentException("User identifier is required", nameof(request.UserId));
        }

        var mission = await _missionRepository.GetByIdAsync(request.MissionId, cancellationToken);
        if (mission is null)
        {
            throw new NotFoundException(nameof(Mission), request.MissionId);
        }

        var delta = request.ProgressDelta;
        if (delta <= 0)
        {
            delta = 1;
        }

        var now = _dateTimeProvider.UtcNow;
        var anchor = MissionCycle.GetAnchorDate(now, mission.Recurrence);

        var progress = await _progressRepository.GetAsync(request.MissionId, request.UserId, cancellationToken);
        var isNew = progress is null;
        if (isNew)
        {
            progress = MissionProgress.Create(request.MissionId, request.UserId, anchor, now);
            await _progressRepository.AddAsync(progress!, cancellationToken);
        }
        else if (progress!.ResetIfExpired(anchor))
        {
            await _progressRepository.UpdateAsync(progress, cancellationToken);
        }

        if (progress!.ApplyDelta(delta, mission.TargetValue, now) && !isNew)
        {
            await _progressRepository.UpdateAsync(progress, cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return mission.ToDto(progress);
    }
}
