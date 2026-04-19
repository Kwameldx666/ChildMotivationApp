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
            var childUserId = userId.Trim();
            var mergedTasksById = new Dictionary<string, Dictionary<string, JsonElement>>(StringComparer.OrdinalIgnoreCase);

            using var assignedTasksResponse = await taskClient.GetAllAsync(null, childUserId, cancellationToken);
            if (assignedTasksResponse.IsSuccessStatusCode)
            {
                foreach (var task in await ReadTasksAsync(assignedTasksResponse, cancellationToken))
                {
                    mergedTasksById[GetTaskId(task)] = task;
                }
            }
            else
            {
                logger.LogWarning(
                    "Failed to load assigned tasks for child {ChildId}. Status: {StatusCode}",
                    childUserId,
                    (int)assignedTasksResponse.StatusCode);
            }

            using var familyMembersResponse = await userServiceClient.GetCurrentFamilyMembersAsync(cancellationToken);
            if (familyMembersResponse.IsSuccessStatusCode)
            {
                var creatorIds = await ReadFamilyMemberIdsAsync(familyMembersResponse, cancellationToken);
                if (creatorIds.Count == 0)
                {
                    creatorIds.Add(childUserId);
                }

                foreach (var creatorId in creatorIds)
                {
                    using var creatorTasksResponse = await taskClient.GetAllAsync(creatorId, null, cancellationToken);
                    if (!creatorTasksResponse.IsSuccessStatusCode)
                    {
                        logger.LogWarning(
                            "Failed to load tasks created by family member {CreatorId} for child {ChildId}. Status: {StatusCode}",
                            creatorId,
                            childUserId,
                            (int)creatorTasksResponse.StatusCode);
                        continue;
                    }

                    var creatorTasks = await ReadTasksAsync(creatorTasksResponse, cancellationToken);
                    foreach (var task in creatorTasks)
                    {
                        mergedTasksById[GetTaskId(task)] = task;
                    }
                }
            }
            else
            {
                logger.LogWarning(
                    "Failed to load family members for child {ChildId}. Status: {StatusCode}",
                    childUserId,
                    (int)familyMembersResponse.StatusCode);

                using var ownTasksResponse = await taskClient.GetAllAsync(childUserId, null, cancellationToken);
                if (ownTasksResponse.IsSuccessStatusCode)
                {
                    foreach (var task in await ReadTasksAsync(ownTasksResponse, cancellationToken))
                    {
                        mergedTasksById[GetTaskId(task)] = task;
                    }
                }
            }

            var tasks = mergedTasksById.Values
                .Where(task => IsTaskVisibleForChild(task, childUserId))
                .OrderBy(GetTaskCompleted)
                .ThenByDescending(task => GetTaskUpdatedAt(task) ?? GetTaskCreatedAt(task))
                .ToList();

            return Ok(tasks);
        }

        if (!isParent && !isChild)
        {
            logger.LogWarning("Unknown role for user {UserId}; applying self-scoped task filter.", userId);
        }

        var createdBy = userId;
        var assignedTo = (isChild && !isParent) ? userId : null;

        using var response = await taskClient.GetAllAsync(createdBy, assignedTo, cancellationToken);
        return await response.ToActionResultAsync();
    }

    private async Task<List<Dictionary<string, JsonElement>>> ReadTasksAsync(HttpResponseMessage response, CancellationToken cancellationToken)
    {
        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        return await JsonSerializer.DeserializeAsync<List<Dictionary<string, JsonElement>>>(stream, SerializerOptions, cancellationToken)
               ?? [];
    }

    private async Task<List<string>> ReadFamilyMemberIdsAsync(HttpResponseMessage response, CancellationToken cancellationToken)
    {
        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        var members = await JsonSerializer.DeserializeAsync<List<Dictionary<string, JsonElement>>>(stream, SerializerOptions, cancellationToken)
                      ?? [];

        return members
            .Select(GetFamilyMemberId)
            .Where(id => !string.IsNullOrWhiteSpace(id))
            .Select(id => id!)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private static string GetTaskId(Dictionary<string, JsonElement> task)
    {
        if (TryGetProperty(task, "id", out var idNode) && idNode.ValueKind == JsonValueKind.String)
        {
            var id = idNode.GetString();
            if (!string.IsNullOrWhiteSpace(id)) return id;
        }

        return Guid.NewGuid().ToString();
    }

    private static bool GetTaskCompleted(Dictionary<string, JsonElement> task)
    {
        return TryGetProperty(task, "completed", out var completedNode)
               && completedNode.ValueKind == JsonValueKind.True;
    }

    private static bool IsTaskVisibleForChild(Dictionary<string, JsonElement> task, string childId)
    {
        if (!GetTaskCompleted(task))
        {
            return true;
        }

        var normalizedChildId = NormalizeIdentifier(childId);
        if (string.IsNullOrWhiteSpace(normalizedChildId))
        {
            return false;
        }

        var assignedTo = NormalizeIdentifier(GetTaskAssignedTo(task));
        if (!string.IsNullOrWhiteSpace(assignedTo))
        {
            return string.Equals(assignedTo, normalizedChildId, StringComparison.OrdinalIgnoreCase);
        }

        var createdBy = NormalizeIdentifier(GetTaskCreatedBy(task));
        return !string.IsNullOrWhiteSpace(createdBy)
               && string.Equals(createdBy, normalizedChildId, StringComparison.OrdinalIgnoreCase);
    }

    private static DateTimeOffset? GetTaskUpdatedAt(Dictionary<string, JsonElement> task)
    {
        return TryReadDateTimeOffset(task, "updatedAt");
    }

    private static DateTimeOffset GetTaskCreatedAt(Dictionary<string, JsonElement> task)
    {
        return TryReadDateTimeOffset(task, "createdAt") ?? DateTimeOffset.MinValue;
    }

    private static string? GetTaskAssignedTo(Dictionary<string, JsonElement> task)
    {
        if (!TryGetProperty(task, "assignedToUserId", out var assignedNode) || assignedNode.ValueKind != JsonValueKind.String)
        {
            return null;
        }

        return assignedNode.GetString();
    }

    private static string? GetTaskCreatedBy(Dictionary<string, JsonElement> task)
    {
        if (!TryGetProperty(task, "createdByUserId", out var createdByNode) || createdByNode.ValueKind != JsonValueKind.String)
        {
            return null;
        }

        return createdByNode.GetString();
    }

    private static string? GetFamilyMemberId(Dictionary<string, JsonElement> member)
    {
        if (!TryGetProperty(member, "id", out var idNode) || idNode.ValueKind != JsonValueKind.String)
        {
            return null;
        }

        var id = idNode.GetString();
        return string.IsNullOrWhiteSpace(id) ? null : id.Trim();
    }

    private static string? NormalizeIdentifier(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return value.Trim().ToLowerInvariant();
    }

    private static DateTimeOffset? TryReadDateTimeOffset(Dictionary<string, JsonElement> task, string name)
    {
        if (!TryGetProperty(task, name, out var dateNode) || dateNode.ValueKind != JsonValueKind.String)
        {
            return null;
        }

        var value = dateNode.GetString();
        return DateTimeOffset.TryParse(value, out var parsed) ? parsed : null;
    }

    private static bool TryGetProperty(Dictionary<string, JsonElement> source, string camelCaseName, out JsonElement value)
    {
        if (source.TryGetValue(camelCaseName, out value)) return true;

        var pascalName = char.ToUpperInvariant(camelCaseName[0]) + camelCaseName.Substring(1);
        return source.TryGetValue(pascalName, out value);
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

    [HttpPost("{id:guid}/start")]
    public async Task<IActionResult> Start(Guid id, CancellationToken cancellationToken)
    {
        using var response = await taskClient.StartAsync(id, cancellationToken);
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