using System.Text.Json;
using Gateway.Application.Abstractions.Infrastructure;
using Gateway.Contracts.Ai;
using Gateway.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Gateway.Features.Controllers;

[ApiController]
[Authorize]
[Route("api-gateway/ai")]
public sealed class AiController(IAiServiceClient aiClient, ITaskServiceClient taskClient, IShopServiceClient shopClient) : ControllerBase
{
    [HttpPost("task-suggestions")]
    public async Task<IActionResult> GetTaskSuggestions([FromBody] AiTaskSuggestionsRequest payload,
        CancellationToken cancellationToken)
    {
        if (payload is null) return BadRequest("Request body cannot be null.");

        var userId = User.GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized("User identifier is missing in the token.");

        var upstreamPayload = new
        {
            requestedByUserId = userId,
            childId = string.IsNullOrWhiteSpace(payload.ChildId) ? userId : payload.ChildId,
            childAge = payload.ChildAge,
            interests = payload.Interests ?? Array.Empty<string>(),
            goals = payload.Goals ?? Array.Empty<string>(),
            recentTasks = payload.RecentTasks ?? Array.Empty<string>(),
            maxSuggestions = payload.MaxSuggestions,
            tone = payload.Tone,
            language = payload.Language
        };

        using var response = await aiClient.GetTaskSuggestionsAsync(upstreamPayload, cancellationToken);
        return await response.ToActionResultAsync();
    }

    [HttpPost("reward-suggestions")]
    public async Task<IActionResult> GetRewardSuggestions([FromBody] AiRewardSuggestionsRequest payload,
        CancellationToken cancellationToken)
    {
        if (payload is null) return BadRequest("Request body cannot be null.");

        var userId = User.GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized("User identifier is missing in the token.");

        var upstreamPayload = new
        {
            requestedByUserId = userId,
            childId = string.IsNullOrWhiteSpace(payload.ChildId) ? userId : payload.ChildId,
            interests = payload.Interests ?? Array.Empty<string>(),
            availablePoints = payload.AvailablePoints,
            occasion = payload.Occasion,
            maxSuggestions = payload.MaxSuggestions,
            recentlyPurchasedRewards = payload.RecentlyPurchasedRewards ?? Array.Empty<string>()
        };

        using var response = await aiClient.GetRewardSuggestionsAsync(upstreamPayload, cancellationToken);
        return await response.ToActionResultAsync();
    }

    [HttpPost("chat")]
    public async Task<IActionResult> SendChat([FromBody] AiChatRequest payload, CancellationToken cancellationToken)
    {
        if (payload is null) return BadRequest("Request body cannot be null.");

        var userId = User.GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized("User identifier is missing in the token.");

        if (string.IsNullOrWhiteSpace(payload.Message)) return BadRequest("Message is required.");

        var history = (payload.History ?? Array.Empty<AiChatHistoryEntry>())
            .Select(entry => new
            {
                role = string.IsNullOrWhiteSpace(entry.Role) ? "user" : entry.Role,
                content = entry.Content,
                timestamp = entry.Timestamp ?? DateTimeOffset.UtcNow
            })
            .ToArray();

        var context = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["requestedByUserId"] = userId
        };

        if (payload.Context is not null)
            foreach (var pair in payload.Context)
                context[pair.Key] = pair.Value;

        var upstreamPayload = new
        {
            requestedByUserId = userId,
            message = payload.Message,
            conversationId = payload.ConversationId,
            history,
            context
        };

        using var response = await aiClient.SendChatAsync(upstreamPayload, cancellationToken);
        return await response.ToActionResultAsync();
    }

    [HttpGet("analytics")]
    public async Task<IActionResult> GetAnalytics([FromQuery] AiAnalyticsQuery query,
        CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized("User identifier is missing in the token.");

        var targetUserId = string.IsNullOrWhiteSpace(query.TargetUserId) ? userId : query.TargetUserId;
        using var response = await aiClient.GetAnalyticsAsync(targetUserId, query.FamilyId, query.WindowDays,
            query.MaxInsights, cancellationToken);
        return await response.ToActionResultAsync();
    }

    [HttpPost("execute-action")]
    public async Task<IActionResult> ExecuteAction([FromBody] ExecuteAiActionRequest request,
        CancellationToken cancellationToken)
    {
        if (request?.Action is null) 
            return BadRequest(new ExecuteAiActionResponse { Success = false, Message = "Action is required." });

        var userId = User.GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) 
            return Unauthorized(new ExecuteAiActionResponse { Success = false, Message = "User identifier is missing." });

        try
        {
            return request.Action.Type.ToUpperInvariant() switch
            {
                "CREATETASK" => await ExecuteCreateTask(request.Action, userId, cancellationToken),
                "CREATETASKS" => await ExecuteCreateTasks(request.Action, userId, cancellationToken),
                "CREATEREWARD" => await ExecuteCreateReward(request.Action, userId, cancellationToken),
                "CREATEREWARDS" => await ExecuteCreateRewards(request.Action, userId, cancellationToken),
                "COMPLETETASK" => await ExecuteCompleteTask(request.Action, cancellationToken),
                _ => Ok(new ExecuteAiActionResponse 
                { 
                    Success = false, 
                    Message = $"Action type '{request.Action.Type}' is not supported for direct execution." 
                })
            };
        }
        catch (Exception ex)
        {
            return Ok(new ExecuteAiActionResponse
            {
                Success = false,
                Message = $"Failed to execute action: {ex.Message}"
            });
        }
    }

    private async Task<IActionResult> ExecuteCreateTask(AiActionDto action, string userId, CancellationToken cancellationToken)
    {
        if (action.Payload is null)
            return Ok(new ExecuteAiActionResponse { Success = false, Message = "Task payload is missing." });

        var payload = action.Payload.Value;
        var title = payload.TryGetProperty("title", out var t) ? t.GetString() : null;
        var description = payload.TryGetProperty("description", out var d) ? d.GetString() : null;

        if (string.IsNullOrWhiteSpace(title))
            return Ok(new ExecuteAiActionResponse { Success = false, Message = "Task title is required." });

        var upstreamPayload = new
        {
            title,
            description,
            createdByUserId = userId,
            confirmationType = "none"
        };

        using var response = await taskClient.CreateAsync(upstreamPayload, cancellationToken);
        if (response.IsSuccessStatusCode)
        {
            var content = await response.Content.ReadAsStringAsync(cancellationToken);
            return Ok(new ExecuteAiActionResponse
            {
                Success = true,
                Message = $"Задача «{title}» успешно создана!",
                Data = JsonSerializer.Deserialize<object>(content)
            });
        }

        return Ok(new ExecuteAiActionResponse
        {
            Success = false,
            Message = "Не удалось создать задачу. Попробуйте позже."
        });
    }

    private async Task<IActionResult> ExecuteCreateTasks(AiActionDto action, string userId, CancellationToken cancellationToken)
    {
        if (action.Payload is null)
            return Ok(new ExecuteAiActionResponse { Success = false, Message = "Tasks payload is missing." });

        var payload = action.Payload.Value;
        if (!payload.TryGetProperty("tasks", out var tasksElement) || tasksElement.ValueKind != JsonValueKind.Array)
            return Ok(new ExecuteAiActionResponse { Success = false, Message = "Tasks array is required." });

        var createdCount = 0;
        foreach (var taskElement in tasksElement.EnumerateArray())
        {
            var title = taskElement.TryGetProperty("title", out var t) ? t.GetString() : null;
            var description = taskElement.TryGetProperty("description", out var d) ? d.GetString() : null;

            if (string.IsNullOrWhiteSpace(title)) continue;

            var upstreamPayload = new
            {
                title,
                description,
                createdByUserId = userId,
                confirmationType = "none"
            };

            using var response = await taskClient.CreateAsync(upstreamPayload, cancellationToken);
            if (response.IsSuccessStatusCode)
                createdCount++;
        }

        return Ok(new ExecuteAiActionResponse
        {
            Success = createdCount > 0,
            Message = createdCount > 0 
                ? $"Создано {createdCount} задач!" 
                : "Не удалось создать задачи."
        });
    }

    private async Task<IActionResult> ExecuteCreateReward(AiActionDto action, string userId, CancellationToken cancellationToken)
    {
        if (action.Payload is null)
            return Ok(new ExecuteAiActionResponse { Success = false, Message = "Reward payload is missing." });

        var payload = action.Payload.Value;
        var title = payload.TryGetProperty("title", out var t) ? t.GetString() : null;
        var description = payload.TryGetProperty("description", out var d) ? d.GetString() : null;
        var cost = payload.TryGetProperty("cost", out var c) ? c.GetInt32() : 100;
        var category = payload.TryGetProperty("category", out var cat) ? cat.GetString() : "general";

        if (string.IsNullOrWhiteSpace(title))
            return Ok(new ExecuteAiActionResponse { Success = false, Message = "Reward title is required." });

        var upstreamPayload = new
        {
            name = title,
            description,
            price = cost,
            category,
            createdByUserId = userId
        };

        using var response = await shopClient.CreateProductAsync(upstreamPayload, cancellationToken);
        if (response.IsSuccessStatusCode)
        {
            var content = await response.Content.ReadAsStringAsync(cancellationToken);
            return Ok(new ExecuteAiActionResponse
            {
                Success = true,
                Message = $"Награда «{title}» добавлена в магазин!",
                Data = JsonSerializer.Deserialize<object>(content)
            });
        }

        return Ok(new ExecuteAiActionResponse
        {
            Success = false,
            Message = "Не удалось создать награду. Попробуйте позже."
        });
    }

    private async Task<IActionResult> ExecuteCreateRewards(AiActionDto action, string userId, CancellationToken cancellationToken)
    {
        if (action.Payload is null)
            return Ok(new ExecuteAiActionResponse { Success = false, Message = "Rewards payload is missing." });

        var payload = action.Payload.Value;
        if (!payload.TryGetProperty("rewards", out var rewardsElement) || rewardsElement.ValueKind != JsonValueKind.Array)
            return Ok(new ExecuteAiActionResponse { Success = false, Message = "Rewards array is required." });

        var createdCount = 0;
        foreach (var rewardElement in rewardsElement.EnumerateArray())
        {
            var title = rewardElement.TryGetProperty("title", out var t) ? t.GetString() : null;
            var description = rewardElement.TryGetProperty("description", out var d) ? d.GetString() : null;
            var cost = rewardElement.TryGetProperty("cost", out var c) ? c.GetInt32() : 100;
            var category = rewardElement.TryGetProperty("category", out var cat) ? cat.GetString() : "general";

            if (string.IsNullOrWhiteSpace(title)) continue;

            var upstreamPayload = new
            {
                name = title,
                description,
                price = cost,
                category,
                createdByUserId = userId
            };

            using var response = await shopClient.CreateProductAsync(upstreamPayload, cancellationToken);
            if (response.IsSuccessStatusCode)
                createdCount++;
        }

        return Ok(new ExecuteAiActionResponse
        {
            Success = createdCount > 0,
            Message = createdCount > 0 
                ? $"Создано {createdCount} наград!" 
                : "Не удалось создать награды."
        });
    }

    private async Task<IActionResult> ExecuteCompleteTask(AiActionDto action, CancellationToken cancellationToken)
    {
        if (action.Payload is null)
            return Ok(new ExecuteAiActionResponse { Success = false, Message = "Task ID is missing." });

        var payload = action.Payload.Value;
        if (!payload.TryGetProperty("taskId", out var taskIdElement))
            return Ok(new ExecuteAiActionResponse { Success = false, Message = "Task ID is required." });

        var taskIdStr = taskIdElement.GetString();
        if (!Guid.TryParse(taskIdStr, out var taskId))
            return Ok(new ExecuteAiActionResponse { Success = false, Message = "Invalid task ID format." });

        using var response = await taskClient.CompleteAsync(taskId, cancellationToken);
        return Ok(new ExecuteAiActionResponse
        {
            Success = response.IsSuccessStatusCode,
            Message = response.IsSuccessStatusCode 
                ? "Задача отмечена как выполненная!" 
                : "Не удалось завершить задачу."
        });
    }
}