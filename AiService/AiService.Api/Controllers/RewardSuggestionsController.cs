using AiService.Application.Abstractions;
using AiService.Application.Contracts;
using Microsoft.AspNetCore.Mvc;

namespace AiService.Api.Controllers;

[ApiController]
[Route("ai-service/reward-suggestions")]
public sealed class RewardSuggestionsController(IAiOrchestrator orchestrator) : ControllerBase
{
    [HttpPost]
    [ProducesResponseType(typeof(RewardSuggestionsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Generate([FromBody] RewardSuggestionsRequest request, CancellationToken cancellationToken)
    {
        if (request is null)
        {
            return BadRequest("Payload is required.");
        }

        var response = await orchestrator.GenerateRewardSuggestionsAsync(request, cancellationToken);
        return Ok(response);
    }
}
