using System.Text.Json;
using Gateway.Application.Abstractions.Infrastructure;
using Gateway.Application.Features.Ai.DTOs;
using Gateway.Authorization;
using Gateway.Contracts.Ai;
using Gateway.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Gateway.Features.Controllers;

[ApiController]
[Authorize]
[Route("api-gateway/ai")]
[RequiresSubscription(SubscriptionFeatures.AiAssistant)]
public sealed class AiController(
    IAiServiceClient aiClient,
    ITaskServiceClient taskClient,
    IShopServiceClient shopClient) : ControllerBase
{
    [HttpPost("task-suggestions")]
    public async Task<IActionResult> GetTaskSuggestions([FromBody] AiTaskSuggestionsRequest? payload,
        CancellationToken cancellationToken)
    {
        if (payload is null) return BadRequest("Request body cannot be null.");

        using var response = await aiClient.GetTaskSuggestionsAsync(payload, cancellationToken);
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

        if (string.IsNullOrWhiteSpace(payload.Message)) return BadRequest("Message is required.");

        var history = payload.History
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
            return Unauthorized(
                new ExecuteAiActionResponse { Success = false, Message = "User identifier is missing." });

        var ru = request.Language == null || request.Language.StartsWith("ru", StringComparison.OrdinalIgnoreCase);

        try
        {
            return request.Action.Type.ToUpperInvariant() switch
            {
                "CREATETASK" => await ExecuteCreateTask(request.Action, userId, ru, cancellationToken),
                "CREATETASKS" => await ExecuteCreateTasks(request.Action, userId, ru, cancellationToken),
                "CREATEREWARD" => await ExecuteCreateReward(request.Action, userId, ru, cancellationToken),
                "CREATEREWARDS" => await ExecuteCreateRewards(request.Action, userId, ru, cancellationToken),
                "COMPLETETASK" => await ExecuteCompleteTask(request.Action, ru, cancellationToken),
                _ => Ok(new ExecuteAiActionResponse
                {
                    Success = false,
                    Message = ru
                        ? $"Тип действия «{request.Action.Type}» не поддерживается для прямого выполнения."
                        : $"Action type '{request.Action.Type}' is not supported for direct execution."
                })
            };
        }
        catch (Exception ex)
        {
            return Ok(new ExecuteAiActionResponse
            {
                Success = false,
                Message = ru
                    ? $"Не удалось выполнить действие: {ex.Message}"
                    : $"Failed to execute action: {ex.Message}"
            });
        }
    }

    private async Task<IActionResult> ExecuteCreateTask(AiActionDto action, string userId, bool ru,
        CancellationToken cancellationToken)
    {
        if (action.Payload is null)
            return Ok(new ExecuteAiActionResponse
            {
                Success = false,
                Message = ru ? "Данные задачи отсутствуют." : "Task payload is missing."
            });

        var payload = action.Payload.Value;
        var title = payload.TryGetProperty("title", out var t) ? t.GetString() : null;
        var description = payload.TryGetProperty("description", out var d) ? d.GetString() : null;

        if (string.IsNullOrWhiteSpace(title))
            return Ok(new ExecuteAiActionResponse
            {
                Success = false,
                Message = ru ? "Название задачи обязательно." : "Task title is required."
            });

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
                Message = ru ? $"Задача «{title}» успешно создана!" : $"Task \"{title}\" created successfully!",
                Data = JsonSerializer.Deserialize<object>(content)
            });
        }

        return Ok(new ExecuteAiActionResponse
        {
            Success = false,
            Message = ru ? "Не удалось создать задачу. Попробуйте позже." : "Failed to create task. Please try again later."
        });
    }

    private async Task<IActionResult> ExecuteCreateTasks(AiActionDto action, string userId, bool ru,
        CancellationToken cancellationToken)
    {
        if (action.Payload is null)
            return Ok(new ExecuteAiActionResponse
            {
                Success = false,
                Message = ru ? "Данные задач отсутствуют." : "Tasks payload is missing."
            });

        var payload = action.Payload.Value;
        if (!payload.TryGetProperty("tasks", out var tasksElement) || tasksElement.ValueKind != JsonValueKind.Array)
            return Ok(new ExecuteAiActionResponse
            {
                Success = false,
                Message = ru ? "Массив задач обязателен." : "Tasks array is required."
            });

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
                ? (ru ? $"Создано задач: {createdCount}!" : $"Created {createdCount} tasks!")
                : (ru ? "Не удалось создать задачи." : "Failed to create tasks.")
        });
    }

    private async Task<IActionResult> ExecuteCreateReward(AiActionDto action, string userId, bool ru,
        CancellationToken cancellationToken)
    {
        if (action.Payload is null)
            return Ok(new ExecuteAiActionResponse
            {
                Success = false,
                Message = ru ? "Данные награды отсутствуют." : "Reward payload is missing."
            });

        var payload = action.Payload.Value;
        var title = payload.TryGetProperty("title", out var t) ? t.GetString() : null;
        var description = payload.TryGetProperty("description", out var d) ? d.GetString() : null;
        var cost = payload.TryGetProperty("cost", out var c) ? c.GetInt32() : 100;
        var category = payload.TryGetProperty("category", out var cat) ? cat.GetString() : "general";

        if (string.IsNullOrWhiteSpace(title))
            return Ok(new ExecuteAiActionResponse
            {
                Success = false,
                Message = ru ? "Название награды обязательно." : "Reward title is required."
            });

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
                Message = ru ? $"Награда «{title}» добавлена в магазин!" : $"Reward \"{title}\" added to shop!",
                Data = JsonSerializer.Deserialize<object>(content)
            });
        }

        return Ok(new ExecuteAiActionResponse
        {
            Success = false,
            Message = ru ? "Не удалось создать награду. Попробуйте позже." : "Failed to create reward. Please try again later."
        });
    }

    private async Task<IActionResult> ExecuteCreateRewards(AiActionDto action, string userId, bool ru,
        CancellationToken cancellationToken)
    {
        if (action.Payload is null)
            return Ok(new ExecuteAiActionResponse
            {
                Success = false,
                Message = ru ? "Данные наград отсутствуют." : "Rewards payload is missing."
            });

        var payload = action.Payload.Value;
        if (!payload.TryGetProperty("rewards", out var rewardsElement) ||
            rewardsElement.ValueKind != JsonValueKind.Array)
            return Ok(new ExecuteAiActionResponse
            {
                Success = false,
                Message = ru ? "Массив наград обязателен." : "Rewards array is required."
            });

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
                ? (ru ? $"Создано наград: {createdCount}!" : $"Created {createdCount} rewards!")
                : (ru ? "Не удалось создать награды." : "Failed to create rewards.")
        });
    }

    private async Task<IActionResult> ExecuteCompleteTask(AiActionDto action, bool ru, CancellationToken cancellationToken)
    {
        if (action.Payload is null)
            return Ok(new ExecuteAiActionResponse
            {
                Success = false,
                Message = ru ? "ID задачи отсутствует." : "Task ID is missing."
            });

        var payload = action.Payload.Value;
        if (!payload.TryGetProperty("taskId", out var taskIdElement))
            return Ok(new ExecuteAiActionResponse
            {
                Success = false,
                Message = ru ? "ID задачи обязателен." : "Task ID is required."
            });

        var taskIdStr = taskIdElement.GetString();
        if (!Guid.TryParse(taskIdStr, out var taskId))
            return Ok(new ExecuteAiActionResponse
            {
                Success = false,
                Message = ru ? "Некорректный формат ID задачи." : "Invalid task ID format."
            });

        using var response = await taskClient.CompleteAsync(taskId, cancellationToken);
        return Ok(new ExecuteAiActionResponse
        {
            Success = response.IsSuccessStatusCode,
            Message = response.IsSuccessStatusCode
                ? (ru ? "Задача отмечена как выполненная!" : "Task marked as completed!")
                : (ru ? "Не удалось выполнить задачу." : "Failed to complete task.")
        });
    }
}