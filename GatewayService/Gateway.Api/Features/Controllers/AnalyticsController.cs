using Gateway.Application.Abstractions.Infrastructure;
using Gateway.Authorization;
using Gateway.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Gateway.Features.Controllers;

[ApiController]
[Authorize]
[Route("api-gateway/analytics")]
[RequiresSubscription(SubscriptionFeatures.AdvancedAnalytics)]
public class AnalyticsController(ITaskServiceClient taskClient) : ControllerBase
{
    [HttpGet("tasks")]
    public async Task<IActionResult> GetTaskAnalytics(
        [FromQuery] int windowDays = 30,
        CancellationToken cancellationToken = default)
    {
        var userId = User.GetUserId();
        if (string.IsNullOrWhiteSpace(userId))
            return Unauthorized("User identifier is missing in the token.");

        using var response = await taskClient.GetAnalyticsAsync(userId, windowDays, cancellationToken);
        return await response.ToActionResultAsync();
    }
}