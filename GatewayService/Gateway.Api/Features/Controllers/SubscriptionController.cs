using Gateway.Application.Abstractions.Infrastructure;
using Gateway.Application.Features.User.DTOs;
using Gateway.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Gateway.Features.Controllers;

[ApiController]
[Authorize]
[Route("api-gateway/user-service/[controller]")]
public class SubscriptionController(IUserServiceClient userServiceClient) : ControllerBase
{
    /// <summary>
    ///     Get current user's subscription
    /// </summary>
    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentSubscriptionAsync(CancellationToken cancellationToken)
    {
        using var response = await userServiceClient.GetCurrentSubscriptionAsync(cancellationToken);

        if (!response.IsSuccessStatusCode && IsChildUser(User))
        {
            return Ok(new
            {
                tier = "Free",
                status = "Active",
                startDate = DateTime.UtcNow.Date,
                endDate = (DateTime?)null,
                pricePerMonth = 0m,
                autoRenew = false,
                maxChildren = 1,
                maxTasksPerDay = 20,
                hasAIAssistant = true,
                hasAdvancedAnalytics = false,
                hasCustomRewards = false,
                hasPrioritySupport = false,
                hasFamilySharing = false,
                hasOfflineMode = false,
                daysRemaining = (int?)null
            });
        }

        return await response.ToActionResultAsync();
    }

    /// <summary>
    ///     Get subscription by userId
    /// </summary>
    [HttpGet("{userId:guid}")]
    public async Task<IActionResult> GetSubscriptionAsync(Guid userId, CancellationToken cancellationToken)
    {
        using var response = await userServiceClient.GetSubscriptionAsync(userId, cancellationToken);
        return await response.ToActionResultAsync();
    }

    /// <summary>
    ///     Change subscription (upgrade/downgrade)
    /// </summary>
    [HttpPost("change")]
    public async Task<IActionResult> ChangeSubscriptionAsync([FromBody] ChangeSubscriptionRequest request,
        CancellationToken cancellationToken)
    {
        if (request is null)
            return BadRequest("Request body cannot be null.");

        using var response = await userServiceClient.ChangeSubscriptionAsync(request, cancellationToken);
        return await response.ToActionResultAsync();
    }

    /// <summary>
    ///     Cancel subscription (downgrade to Free)
    /// </summary>
    [HttpPost("cancel")]
    public async Task<IActionResult> CancelSubscriptionAsync(CancellationToken cancellationToken)
    {
        using var response = await userServiceClient.CancelSubscriptionAsync(cancellationToken);
        return await response.ToActionResultAsync();
    }

    /// <summary>
    ///     Get available subscription tiers
    /// </summary>
    [AllowAnonymous]
    [HttpGet("tiers")]
    public async Task<IActionResult> GetSubscriptionTiersAsync(CancellationToken cancellationToken)
    {
        using var response = await userServiceClient.GetSubscriptionTiersAsync(cancellationToken);
        return await response.ToActionResultAsync();
    }

    private static bool IsChildUser(ClaimsPrincipal user)
    {
        var role = user.FindFirst(ClaimTypes.Role)?.Value
                   ?? user.FindFirst("role")?.Value;

        return string.Equals(role, "child", StringComparison.OrdinalIgnoreCase)
               || user.IsInRole("child");
    }
}