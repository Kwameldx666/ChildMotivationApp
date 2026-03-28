using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UserService.Api.Authorization;
using UserService.Application.Dto.Subscription;
using UserService.Application.Features.Subscription.CancelSubscription;
using UserService.Application.Features.Subscription.ChangeSubscription;
using UserService.Application.Features.Subscription.GetSubscription;
using UserService.Domain.Enums;

namespace UserService.Api.Controllers;

[ApiController]
[Route("user-service/[controller]")]
public class SubscriptionController(IMediator mediator) : ControllerBase
{
    /// <summary>
    /// Get subscription of the current user
    /// </summary>
    [Authorize(Policy = AuthorizationConstants.UserReadPolicy)]
    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentSubscriptionAsync(CancellationToken cancellationToken)
    {
        if (!TryResolveUserId(out var userId, out var errorResult))
        {
            return errorResult ?? Unauthorized("User identifier is missing.");
        }

        var subscription = await mediator.Send(new GetSubscriptionQuery(userId), cancellationToken);
        return Ok(subscription);
    }

    /// <summary>
    /// Get subscription by userId
    /// </summary>
    [Authorize(Policy = AuthorizationConstants.UserReadPolicy)]
    [HttpGet("{userId:guid}")]
    public async Task<IActionResult> GetSubscriptionAsync(Guid userId, CancellationToken cancellationToken)
    {
        var subscription = await mediator.Send(new GetSubscriptionQuery(userId), cancellationToken);
        return Ok(subscription);
    }

    /// <summary>
    /// Change subscription (upgrade/downgrade)
    /// </summary>
    [Authorize]
    [HttpPost("change")]
    public async Task<IActionResult> ChangeSubscriptionAsync(
        [FromBody] ChangeSubscriptionRequest request, 
        CancellationToken cancellationToken)
    {
        if (!IsParentUser())
        {
            return Forbid();
        }

        if (!TryResolveUserId(out var userId, out var errorResult))
        {
            return errorResult ?? Unauthorized("User identifier is missing.");
        }

        if (!Enum.TryParse<SubscriptionTier>(request.Tier, true, out var tier))
        {
            return BadRequest($"Invalid subscription tier: {request.Tier}. Valid values: Free, Basic, Premium, Family");
        }

        var command = new ChangeSubscriptionCommand(userId, tier, request.AutoRenew);
        var subscription = await mediator.Send(command, cancellationToken);
        
        return Ok(subscription);
    }

    /// <summary>
    /// Cancel subscription (downgrade to Free)
    /// </summary>
    [Authorize]
    [HttpPost("cancel")]
    public async Task<IActionResult> CancelSubscriptionAsync(CancellationToken cancellationToken)
    {
        if (!IsParentUser())
        {
            return Forbid();
        }

        if (!TryResolveUserId(out var userId, out var errorResult))
        {
            return errorResult ?? Unauthorized("User identifier is missing.");
        }

        var subscription = await mediator.Send(new CancelSubscriptionCommand(userId), cancellationToken);
        return Ok(subscription);
    }

    /// <summary>
    /// Get available subscription tiers
    /// </summary>
    [HttpGet("tiers")]
    public IActionResult GetAvailableTiers()
    {
        var tiers = new[]
        {
            new { Name = "Free", DisplayName = "Free", Price = 0, MaxChildren = 2, MaxTasksPerDay = 10 },
            new { Name = "Basic", DisplayName = "Basic", Price = 49, MaxChildren = 5, MaxTasksPerDay = 30 },
            new { Name = "Premium", DisplayName = "Premium", Price = 99, MaxChildren = 10, MaxTasksPerDay = 100 },
            new { Name = "Family", DisplayName = "Family", Price = 149, MaxChildren = 20, MaxTasksPerDay = 1000 }
        };

        return Ok(tiers);
    }

    private bool TryResolveUserId(out Guid userId, out IActionResult? errorResult)
    {
        userId = Guid.Empty;
        errorResult = null;

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                          ?? User.FindFirst("sub")?.Value;

        if (string.IsNullOrEmpty(userIdClaim))
        {
            errorResult = Unauthorized("User identifier is missing from token.");
            return false;
        }

        if (!Guid.TryParse(userIdClaim, out userId))
        {
            errorResult = BadRequest("Invalid user identifier format.");
            return false;
        }

        return true;
    }

    private bool IsParentUser()
    {
        var roleClaims = User.FindAll(ClaimTypes.Role)
            .Concat(User.FindAll("role"))
            .Select(claim => claim.Value);

        if (roleClaims.Any(role => string.Equals(role, "Parent", StringComparison.OrdinalIgnoreCase)))
        {
            return true;
        }

        return User.IsInRole("Parent") || User.IsInRole("parent");
    }
}
