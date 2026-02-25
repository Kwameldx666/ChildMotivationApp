using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskService.Application.Features.Analytics.Queries.GetAnalytics;

namespace TaskService.Api.Controllers;

[ApiController]
[Authorize]
[Route("task-service/analytics")]
public class AnalyticsController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<AnalyticsDto>> GetAnalytics(
        [FromQuery] string userId,
        [FromQuery] int windowDays = 30,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(userId))
            return BadRequest("UserId is required");

        var query = new GetAnalyticsQuery(userId, windowDays);
        var result = await mediator.Send(query, cancellationToken);
        return Ok(result);
    }
}
