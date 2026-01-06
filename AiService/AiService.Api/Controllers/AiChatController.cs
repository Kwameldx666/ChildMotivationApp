using AiService.Application.Abstractions;
using AiService.Application.Contracts;
using Microsoft.AspNetCore.Mvc;

namespace AiService.Api.Controllers;

[ApiController]
[Route("ai-service/chat")]
public sealed class AiChatController(IAiOrchestrator orchestrator) : ControllerBase
{
    [HttpPost]
    [ProducesResponseType(typeof(AiChatResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Send([FromBody] AiChatRequest request, CancellationToken cancellationToken)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.Message)) return BadRequest("Message is required.");

        var response = await orchestrator.ProcessChatAsync(request, cancellationToken);
        return Ok(response);
    }
}