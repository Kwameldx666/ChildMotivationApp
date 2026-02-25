using MediatR;
using TaskService.Application.Dto.Missions;

namespace TaskService.Application.Features.Missions.Commands.UpdateMissionProgress;

public record UpdateMissionProgressCommand(Guid MissionId, string UserId, int ProgressDelta) : IRequest<MissionDto>;
