using AiService.Application.Abstractions;
using AiService.Application.Contracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AiService.Api.Controllers;

[ApiController]
[Authorize]
[Route("ai-service/task-suggestions")]
public sealed class TaskSuggestionsController(IAiOrchestrator orchestrator) : ControllerBase
{
    [HttpPost]
    [ProducesResponseType(typeof(TaskSuggestionsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Generate([FromBody] TaskSuggestionsRequest request,
        CancellationToken cancellationToken)
    {
        if (request is null) return BadRequest("Payload is required.");

        var response = await orchestrator.GenerateTaskSuggestionsAsync(request, cancellationToken);
        return Ok(response);
    }
}