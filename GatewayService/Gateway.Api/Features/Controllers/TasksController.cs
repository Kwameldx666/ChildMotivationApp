using Gateway.Application.Abstractions.Infrastructure;
using Gateway.Contracts.Tasks;
using Gateway.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Text.Json;

namespace Gateway.Features.Controllers;

[ApiController]
[Authorize]
[Route("api-gateway/[controller]")]
public class TasksController(
    ITaskServiceClient taskClient,
    IUserServiceClient userServiceClient,
    ILogger<TasksController> logger) : ControllerBase
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true
    };

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized("User identifier is missing in the token.");

        var role = User.FindFirst(ClaimTypes.Role)?.Value?.ToLowerInvariant()
                   ?? User.FindFirst("role")?.Value?.ToLowerInvariant();

        var isParent = role == "parent" || User.IsInRole("parent");
        var isChild = role == "child" || User.IsInRole("child");

        if (isChild)
        {
            using var assignedTasksResponse = await taskClient.GetAllAsync(null, userId, cancellationToken);
            if (!assignedTasksResponse.IsSuccessStatusCode)
            {
                return await assignedTasksResponse.ToActionResultAsync();
            }

            var mergedTasksById = (await ReadTasksAsync(assignedTasksResponse, cancellationToken))
                .ToDictionary(task => task.Id, task => task);

            using var familyMembersResponse = await userServiceClient.GetCurrentFamilyMembersAsync(cancellationToken);
            if (familyMembersResponse.IsSuccessStatusCode)
            {
                var parentIds = await ReadParentIdsAsync(familyMembersResponse, userId, cancellationToken);

                foreach (var parentId in parentIds)
                {
                    using var parentTasksResponse = await taskClient.GetAllAsync(parentId, null, cancellationToken);
                    if (!parentTasksResponse.IsSuccessStatusCode)
                    {
                        logger.LogWarning(
                            "Failed to fetch tasks created by parent {ParentId} for child {ChildId}. Status: {StatusCode}",
                            parentId,
                            userId,
                            (int)parentTasksResponse.StatusCode);
                        continue;
                    }

                    var parentTasks = await ReadTasksAsync(parentTasksResponse, cancellationToken);
                    foreach (var task in parentTasks.Where(task =>
                                 string.IsNullOrWhiteSpace(task.AssignedToUserId) ||
                                 task.AssignedToUserId == userId))
                    {
                        mergedTasksById.TryAdd(task.Id, task);
                    }
                }
            }
            else
            {
                logger.LogWarning(
                    "Failed to load family members for child {ChildId}. Status: {StatusCode}",
                    userId,
                    (int)familyMembersResponse.StatusCode);
            }

            var tasks = mergedTasksById.Values
                .OrderBy(task => task.Completed)
                .ThenByDescending(task => task.UpdatedAt ?? task.CreatedAt)
                .ToList();

            return Ok(tasks);
        }

        var createdBy = isParent ? userId : null;
        var assignedTo = (isChild && !isParent) ? userId : null;

        using var response = await taskClient.GetAllAsync(createdBy, assignedTo, cancellationToken);
        return await response.ToActionResultAsync();
    }

    private async Task<List<TaskListItem>> ReadTasksAsync(HttpResponseMessage response, CancellationToken cancellationToken)
    {
        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        return await JsonSerializer.DeserializeAsync<List<TaskListItem>>(stream, SerializerOptions, cancellationToken)
               ?? [];
    }

    private static async Task<IReadOnlyList<string>> ReadParentIdsAsync(
        HttpResponseMessage response,
        string currentUserId,
        CancellationToken cancellationToken)
    {
        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        using var document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);

        var root = document.RootElement;
        var members = root.ValueKind == JsonValueKind.Array
            ? root
            : root.TryGetProperty("data", out var dataNode) && dataNode.ValueKind == JsonValueKind.Array
                ? dataNode
                : root.TryGetProperty("items", out var itemsNode) && itemsNode.ValueKind == JsonValueKind.Array
                    ? itemsNode
                    : default;

        if (members.ValueKind != JsonValueKind.Array)
        {
            return [];
        }

        var parentIds = new List<string>();

        foreach (var member in members.EnumerateArray())
        {
            if (member.ValueKind != JsonValueKind.Object) continue;

            var role = member.TryGetProperty("role", out var roleNode)
                ? roleNode.GetString()
                : null;
            if (!string.Equals(role, "parent", StringComparison.OrdinalIgnoreCase)) continue;

            var memberId = member.TryGetProperty("id", out var idNode)
                ? idNode.GetString()
                : member.TryGetProperty("userId", out var userIdNode)
                    ? userIdNode.GetString()
                    : null;

            if (string.IsNullOrWhiteSpace(memberId) || memberId == currentUserId) continue;
            parentIds.Add(memberId);
        }

        return parentIds;
    }

    private sealed record TaskListItem
    {
        public Guid Id { get; init; }
        public bool Completed { get; init; }
        public DateTimeOffset CreatedAt { get; init; }
        public DateTimeOffset? UpdatedAt { get; init; }
        public string? AssignedToUserId { get; init; }
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

    [HttpPost("{id:guid}/request-approval")]
    public async Task<IActionResult> RequestApproval(Guid id, CancellationToken cancellationToken)
    {
        using var response = await taskClient.RequestApprovalAsync(id, cancellationToken);
        return await response.ToActionResultAsync();
    }

    [HttpPost("{id:guid}/approve")]
    public async Task<IActionResult> Approve(Guid id, CancellationToken cancellationToken)
    {
        using var response = await taskClient.ApproveAsync(id, cancellationToken);
        return await response.ToActionResultAsync();
    }

    [HttpPost("{id:guid}/reject")]
    public async Task<IActionResult> Reject(Guid id, CancellationToken cancellationToken)
    {
        using var response = await taskClient.RejectAsync(id, cancellationToken);
        return await response.ToActionResultAsync();
    }

    [HttpPost("{id:guid}/evidence")]
    public async Task<IActionResult> 
    UploadEvidence(Guid id, IFormFile? file, CancellationToken cancellationToken)
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