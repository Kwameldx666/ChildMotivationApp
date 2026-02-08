using Gateway.Application.Abstractions.Infrastructure;
using Gateway.Contracts.Tasks;
using Gateway.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Gateway.Features.Controllers;

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

        var role = User.FindFirst("role")?.Value?.ToLowerInvariant();

        var createdBy = role == "parent" ? userId : null;
        var assignedTo = role == "child" ? userId : null;

        using var response = await taskClient.GetAllAsync(createdBy, assignedTo, cancellationToken);
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
            createdByUserId = userId,
            confirmationType = payload.ConfirmationType,
            difficulty = payload.Difficulty,
            assignedToUserId = payload.AssignedToUserId
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

    [HttpPost("{id:guid}/evidence")]
    public async Task<IActionResult> UploadEvidence(Guid id, IFormFile? file, CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0) return BadRequest("A confirmation file must be attached.");

        var userId = User.GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized("User identifier is missing in the token.");

        await using var stream = file.OpenReadStream();
        using var response = await taskClient.UploadEvidenceAsync(
            id,
            stream,
            file.FileName,
            string.IsNullOrWhiteSpace(file.ContentType) ? "application/octet-stream" : file.ContentType,
            userId,
            cancellationToken);

        return await response.ToActionResultAsync();
    }

    [HttpGet("{id:guid}/evidence")]
    public async Task<IActionResult> DownloadEvidence(Guid id, CancellationToken cancellationToken)
    {
        using var response = await taskClient.DownloadEvidenceAsync(id, cancellationToken);
        if (!response.IsSuccessStatusCode) return await response.ToActionResultAsync();

        var bytes = await response.Content.ReadAsByteArrayAsync();
        var contentType = response.Content.Headers.ContentType?.ToString() ?? "application/octet-stream";
        var fileName = response.Content.Headers.ContentDisposition?.FileNameStar
                       ?? response.Content.Headers.ContentDisposition?.FileName?.Trim('"')
                       ?? $"evidence-{id}";

        return File(bytes, contentType, fileName);
    }
}