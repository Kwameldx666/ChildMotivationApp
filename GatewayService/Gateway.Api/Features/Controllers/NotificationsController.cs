using Gateway.Application.Abstractions.Infrastructure;
using Gateway.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Gateway.Features.Controllers;

[ApiController]
[Authorize]
[Route("api-gateway/[controller]")]
public class NotificationsController(INotificationServiceClient notificationClient) : ControllerBase
{
    /// <summary>
    /// Получить все уведомления текущего пользователя
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) 
            return Unauthorized("User identifier is missing in the token.");
        
        using var response = await notificationClient.GetAllAsync(userId, cancellationToken);
        return await response.ToActionResultAsync();
    }

    /// <summary>
    /// Получить непрочитанные уведомления
    /// </summary>
    [HttpGet("unread")]
    public async Task<IActionResult> GetUnread(CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) 
            return Unauthorized("User identifier is missing in the token.");
        
        using var response = await notificationClient.GetUnreadAsync(userId, cancellationToken);
        return await response.ToActionResultAsync();
    }

    /// <summary>
    /// Получить количество непрочитанных уведомлений
    /// </summary>
    [HttpGet("unread/count")]
    public async Task<IActionResult> GetUnreadCount(CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) 
            return Unauthorized("User identifier is missing in the token.");
        
        using var response = await notificationClient.GetUnreadCountAsync(userId, cancellationToken);
        return await response.ToActionResultAsync();
    }

    /// <summary>
    /// Отметить уведомления как прочитанные
    /// </summary>
    [HttpPost("mark-read")]
    public async Task<IActionResult> MarkAsRead([FromBody] MarkReadRequest request, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) 
            return Unauthorized("User identifier is missing in the token.");
        
        if (request?.NotificationIds == null || request.NotificationIds.Count == 0)
            return BadRequest("NotificationIds cannot be empty.");
        
        using var response = await notificationClient.MarkAsReadAsync(userId, request.NotificationIds, cancellationToken);
        return await response.ToActionResultAsync();
    }

    /// <summary>
    /// Отметить все уведомления как прочитанные
    /// </summary>
    [HttpPost("mark-all-read")]
    public async Task<IActionResult> MarkAllAsRead(CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) 
            return Unauthorized("User identifier is missing in the token.");
        
        using var response = await notificationClient.MarkAllAsReadAsync(userId, cancellationToken);
        return await response.ToActionResultAsync();
    }

    /// <summary>
    /// Удалить уведомление
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) 
            return Unauthorized("User identifier is missing in the token.");
        
        using var response = await notificationClient.DeleteAsync(userId, id, cancellationToken);
        return await response.ToActionResultAsync();
    }
}

public record MarkReadRequest(List<string> NotificationIds);
