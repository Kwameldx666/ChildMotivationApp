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
    /// Получить подписку текущего пользователя
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
    /// Получить подписку по userId
    /// </summary>
    [Authorize(Policy = AuthorizationConstants.UserReadPolicy)]
    [HttpGet("{userId:guid}")]
    public async Task<IActionResult> GetSubscriptionAsync(Guid userId, CancellationToken cancellationToken)
    {
        var subscription = await mediator.Send(new GetSubscriptionQuery(userId), cancellationToken);
        return Ok(subscription);
    }

    /// <summary>
    /// Изменить подписку (upgrade/downgrade)
    /// </summary>
    [Authorize(Policy = AuthorizationConstants.UserWritePolicy)]
    [HttpPost("change")]
    public async Task<IActionResult> ChangeSubscriptionAsync(
        [FromBody] ChangeSubscriptionRequest request, 
        CancellationToken cancellationToken)
    {
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
    /// Отменить подписку (переход на Free)
    /// </summary>
    [Authorize(Policy = AuthorizationConstants.UserWritePolicy)]
    [HttpPost("cancel")]
    public async Task<IActionResult> CancelSubscriptionAsync(CancellationToken cancellationToken)
    {
        if (!TryResolveUserId(out var userId, out var errorResult))
        {
            return errorResult ?? Unauthorized("User identifier is missing.");
        }

        var subscription = await mediator.Send(new CancelSubscriptionCommand(userId), cancellationToken);
        return Ok(subscription);
    }

    /// <summary>
    /// Получить доступные тарифы подписок
    /// </summary>
    [HttpGet("tiers")]
    public IActionResult GetAvailableTiers()
    {
        var tiers = new[]
        {
            new { Name = "Free", DisplayName = "Бесплатный", Price = 0, MaxChildren = 2, MaxTasksPerDay = 10 },
            new { Name = "Basic", DisplayName = "Базовый", Price = 299, MaxChildren = 5, MaxTasksPerDay = 30 },
            new { Name = "Premium", DisplayName = "Премиум", Price = 599, MaxChildren = 10, MaxTasksPerDay = 100 },
            new { Name = "Family", DisplayName = "Семейный", Price = 999, MaxChildren = 20, MaxTasksPerDay = 1000 }
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
}
