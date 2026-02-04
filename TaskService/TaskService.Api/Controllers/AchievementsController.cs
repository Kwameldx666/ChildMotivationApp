using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskService.Api.Contracts.Achievements;
using TaskService.Application.Dto.Achievements;
using TaskService.Application.Features.Achievements.Commands.UpdateAchievementProgress;
using TaskService.Application.Features.Achievements.Queries.GetAchievements;

namespace TaskService.Api.Controllers;

[ApiController]
[Authorize]
[Route("task-service/[controller]")]
public class AchievementsController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<AchievementDto>>> GetAll([FromQuery] string? userId, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            return BadRequest("User identifier is required.");
        }

        var achievements = await mediator.Send(new GetAchievementsQuery(userId), cancellationToken);
        return Ok(achievements);
    }

    [HttpPost("{id:guid}/progress")]
    public async Task<ActionResult<AchievementDto>> UpdateProgress(Guid id, [FromBody] UpdateAchievementProgressRequest request, CancellationToken cancellationToken)
    {
        if (request is null)
        {
            return BadRequest("Request body cannot be null.");
        }

        if (string.IsNullOrWhiteSpace(request.UserId))
        {
            return BadRequest("User identifier is required.");
        }

        var command = new UpdateAchievementProgressCommand(id, request.UserId, request.ProgressDelta);
        var updated = await mediator.Send(command, cancellationToken);
        return Ok(updated);
    }
}
