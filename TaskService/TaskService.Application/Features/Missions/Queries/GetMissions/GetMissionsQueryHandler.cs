using System.Linq;
using MediatR;
using TaskService.Application.Abstractions;
using TaskService.Application.Dto.Missions;
using TaskService.Application.Mappings;
using TaskService.Domain.Repositories;
using TaskService.Domain.ValueObjects;

namespace TaskService.Application.Features.Missions.Queries.GetMissions;

public class GetMissionsQueryHandler : IRequestHandler<GetMissionsQuery, IReadOnlyList<MissionDto>>
{
    private readonly IMissionRepository _missionRepository;
    private readonly IMissionProgressRepository _progressRepository;
    private readonly IDateTimeProvider _dateTimeProvider;
    private readonly IUnitOfWork _unitOfWork;

    public GetMissionsQueryHandler(
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

    public async Task<IReadOnlyList<MissionDto>> Handle(GetMissionsQuery request, CancellationToken cancellationToken)
    {
        var normalizedUserId = NormalizeUserId(request.UserId);
        if (string.IsNullOrWhiteSpace(normalizedUserId))
        {
            return Array.Empty<MissionDto>();
        }

        var missions = await _missionRepository.GetActiveAsync(request.Recurrence, cancellationToken);
        if (missions.Count == 0)
        {
            return Array.Empty<MissionDto>();
        }

        var missionLookup = missions.ToDictionary(mission => mission.Id);
        var missionIds = missionLookup.Keys.ToArray();

        var progressItems = await _progressRepository.GetByUserAsync(normalizedUserId, missionIds, cancellationToken);
        var progressByMission = progressItems.ToDictionary(progress => progress.MissionId);

        var now = _dateTimeProvider.UtcNow;
        var hasUpdates = false;

        foreach (var progress in progressItems)
        {
            if (!missionLookup.TryGetValue(progress.MissionId, out var mission))
            {
                continue;
            }

            var anchor = MissionCycle.GetAnchorDate(now, mission.Recurrence);
            if (progress.ResetIfExpired(anchor))
            {
                await _progressRepository.UpdateAsync(progress, cancellationToken);
                hasUpdates = true;
            }
        }

        if (hasUpdates)
        {
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        var result = missions
            .OrderBy(mission => mission.SortOrder)
            .ThenBy(mission => mission.CreatedAt)
            .Select(mission =>
            {
                progressByMission.TryGetValue(mission.Id, out var missionProgress);
                return mission.ToDto(missionProgress);
            })
            .ToList();

        return result;
    }

    private static string NormalizeUserId(string userId)
    {
        return userId?.Trim().ToLowerInvariant() ?? string.Empty;
    }
}
