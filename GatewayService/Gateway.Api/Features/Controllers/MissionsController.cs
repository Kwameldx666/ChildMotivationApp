using Gateway.Application.Abstractions.Infrastructure;
using Gateway.Contracts.Missions;
using Gateway.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Gateway.Features.Controllers;

[ApiController]
[Authorize]
[Route("api-gateway/[controller]")]
public class MissionsController(ITaskServiceClient taskClient) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? recurrence, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized("User identifier is missing in the token.");

        using var response = await taskClient.GetMissionsAsync(userId, recurrence, cancellationToken);
        return await response.ToActionResultAsync();
    }

    [HttpPost("{id:guid}/progress")]
    public async Task<IActionResult> UpdateProgress(Guid id, [FromBody] UpdateMissionProgressRequest? request,
        CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized("User identifier is missing in the token.");

        var payload = new
        {
            userId,
            progressDelta = request?.ProgressDelta ?? 1
        };

        using var response = await taskClient.UpdateMissionProgressAsync(id, payload, cancellationToken);
        return await response.ToActionResultAsync();
    }
}