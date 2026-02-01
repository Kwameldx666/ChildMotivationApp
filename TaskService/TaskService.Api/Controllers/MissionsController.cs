using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskService.Api.Contracts.Missions;
using TaskService.Application.Dto.Missions;
using TaskService.Application.Features.Missions.Commands.UpdateMissionProgress;
using TaskService.Application.Features.Missions.Queries.GetMissions;
using TaskService.Domain.Enums;

namespace TaskService.Api.Controllers;

[ApiController]
[Authorize]
[Route("task-service/[controller]")]
public class MissionsController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<MissionDto>>> GetAll(
        [FromQuery] string? userId,
        [FromQuery] string? recurrence,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            return BadRequest("User identifier is required.");
        }

        var recurrenceFilter = TryParseRecurrence(recurrence);
        var missions = await mediator.Send(new GetMissionsQuery(userId, recurrenceFilter), cancellationToken);
        return Ok(missions);
    }

    [HttpPost("{id:guid}/progress")]
    public async Task<ActionResult<MissionDto>> UpdateProgress(Guid id, [FromBody] UpdateMissionProgressRequest request, CancellationToken cancellationToken)
    {
        if (request is null)
        {
            return BadRequest("Request body cannot be null.");
        }

        if (string.IsNullOrWhiteSpace(request.UserId))
        {
            return BadRequest("User identifier is required.");
        }

        var command = new UpdateMissionProgressCommand(id, request.UserId, request.ProgressDelta);
        var updated = await mediator.Send(command, cancellationToken);
        return Ok(updated);
    }

    private static MissionRecurrence? TryParseRecurrence(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return value.Trim().ToLowerInvariant() switch
        {
            "daily" => MissionRecurrence.Daily,
            "weekly" => MissionRecurrence.Weekly,
            _ => null
        };
    }
}
