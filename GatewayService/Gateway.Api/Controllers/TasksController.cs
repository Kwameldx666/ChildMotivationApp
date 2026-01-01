using Gateway.Api.Contracts.Tasks;
using Gateway.Application.Abstractions.Infrastructure;
using Gateway.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Gateway.Controllers;

[ApiController]
[Authorize]
[Route("api-gateway/[controller]")]
public class TasksController(ITaskServiceClient taskClient) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized("User identifier is missing in the token.");

        using var response = await taskClient.GetAllAsync(userId, cancellationToken);
        return await response.ToActionResultAsync();
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken cancellationToken)
    {
        using var response = await taskClient.GetAsync(id, cancellationToken);
        return await response.ToActionResultAsync();
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTaskRequest payload, CancellationToken cancellationToken)
    {
        if (payload is null) return BadRequest("Request body cannot be null.");

        var userId = User.GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized("User identifier is missing in the token.");

        var upstreamPayload = new
        {
            title = payload.Title,
            description = payload.Description,
            createdByUserId = userId
        };

        using var response = await taskClient.CreateAsync(upstreamPayload, cancellationToken);
        return await response.ToActionResultAsync();
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] object? payload, CancellationToken cancellationToken)
    {
        if (payload is null) return BadRequest("Request body cannot be null.");
        using var response = await taskClient.UpdateAsync(id, payload, cancellationToken);
        return await response.ToActionResultAsync();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        using var response = await taskClient.DeleteAsync(id, cancellationToken);
        return await response.ToActionResultAsync();
    }

    [HttpPost("{id:guid}/complete")]
    public async Task<IActionResult> Complete(Guid id, CancellationToken cancellationToken)
    {
        using var response = await taskClient.CompleteAsync(id, cancellationToken);
        return await response.ToActionResultAsync();
    }
}
