using AiService.Application.Abstractions;
using AiService.Application.Contracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AiService.Api.Controllers;

[ApiController]
[Authorize]
[Route("ai-service/analytics")]
public sealed class AiAnalyticsController(IAiOrchestrator orchestrator) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(AiAnalyticsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Get([FromQuery] AiAnalyticsRequest? request, CancellationToken cancellationToken)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.UserId))
            return BadRequest("UserId query parameter is required.");

        var response = await orchestrator.BuildAnalyticsAsync(request, cancellationToken);
        return Ok(response);
    }
}