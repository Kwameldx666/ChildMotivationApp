using MediatR;
using TaskService.Application.Dto.Missions;
using TaskService.Domain.Enums;

namespace TaskService.Application.Features.Missions.Queries.GetMissions;

public record GetMissionsQuery(string UserId, MissionRecurrence? Recurrence) : IRequest<IReadOnlyList<MissionDto>>;
