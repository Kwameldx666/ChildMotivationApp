using Gateway.Application.Abstractions.Infrastructure;
using Gateway.Contracts.Achievements;
using Gateway.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Gateway.Features.Controllers;

[ApiController]
[Authorize]
[Route("api-gateway/[controller]")]
public class AchievementsController(ITaskServiceClient taskClient) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var userId = User.GetUserId()?.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized("User identifier is missing in the token.");

        using var response = await taskClient.GetAchievementsAsync(userId, cancellationToken);
        return await response.ToActionResultAsync();
    }

    [HttpPost("{id:guid}/progress")]
    public async Task<IActionResult> UpdateProgress(Guid id, [FromBody] UpdateAchievementProgressRequest? request,
        CancellationToken cancellationToken)
    {
        var userId = User.GetUserId()?.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized("User identifier is missing in the token.");

        var payload = new
        {
            userId,
            progressDelta = request?.ProgressDelta ?? 1
        };

        using var response = await taskClient.UpdateAchievementProgressAsync(id, payload, cancellationToken);
        return await response.ToActionResultAsync();
    }
}