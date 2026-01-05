using Gateway.Application.Abstractions.Infrastructure;
using Gateway.Contracts.Ai;
using Gateway.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Gateway.Features.Controllers;

[ApiController]
[Authorize]
[Route("api-gateway/ai")]
public sealed class AiController(IAiServiceClient aiClient) : ControllerBase
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
}