using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using NotificationService.Application.Services;
using NotificationService.Domain.Models;

namespace NotificationService.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UserNotificationsController : ControllerBase
{
    private readonly INotificationStorageService _storageService;
    private readonly ILogger<UserNotificationsController> _logger;

    public UserNotificationsController(
        INotificationStorageService storageService,
        ILogger<UserNotificationsController> logger)
    {
        _storageService = storageService;
        _logger = logger;
    }

    /// <summary>
    /// Get all user notifications
    /// </summary>
    [HttpGet("{userId}")]
    public async Task<IActionResult> GetAll(string userId)
    {
        try
        {
            var notifications = await _storageService.GetAllAsync(userId);
            return Ok(notifications);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting notifications for user {UserId}", userId);
            return StatusCode(500, new { error = "Failed to get notifications" });
        }
    }

    /// <summary>
    /// Get unread notifications
    /// </summary>
    [HttpGet("{userId}/unread")]
    public async Task<IActionResult> GetUnread(string userId)
    {
        try
        {
            var notifications = await _storageService.GetUnreadAsync(userId);
            return Ok(notifications);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting unread notifications for user {UserId}", userId);
            return StatusCode(500, new { error = "Failed to get unread notifications" });
        }
    }

    /// <summary>
    /// Get count of unread notifications
    /// </summary>
    [HttpGet("{userId}/unread/count")]
    public async Task<IActionResult> GetUnreadCount(string userId)
    {
        try
        {
            var count = await _storageService.GetUnreadCountAsync(userId);
            return Ok(new { count });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting unread count for user {UserId}", userId);
            return StatusCode(500, new { error = "Failed to get unread count" });
        }
    }

    /// <summary>
    /// Mark notifications as read
    /// </summary>
    [HttpPost("{userId}/mark-read")]
    public async Task<IActionResult> MarkAsRead(string userId, [FromBody] MarkReadRequest request)
    {
        try
        {
            if (request?.NotificationIds == null || request.NotificationIds.Count == 0)
                return BadRequest("NotificationIds cannot be empty");

            var guids = request.NotificationIds
                .Where(id => Guid.TryParse(id, out _))
                .Select(Guid.Parse)
                .ToList();

            await _storageService.MarkAsReadAsync(userId, guids);
            return Ok(new { message = "Notifications marked as read" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking notifications as read for user {UserId}", userId);
            return StatusCode(500, new { error = "Failed to mark notifications as read" });
        }
    }

    /// <summary>
    /// Mark all notifications as read
    /// </summary>
    [HttpPost("{userId}/mark-all-read")]
    public async Task<IActionResult> MarkAllAsRead(string userId)
    {
        try
        {
            await _storageService.MarkAllAsReadAsync(userId);
            return Ok(new { message = "All notifications marked as read" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking all notifications as read for user {UserId}", userId);
            return StatusCode(500, new { error = "Failed to mark all notifications as read" });
        }
    }

    /// <summary>
    /// Delete notification
    /// </summary>
    [HttpDelete("{userId}/{notificationId:guid}")]
    public async Task<IActionResult> Delete(string userId, Guid notificationId)
    {
        try
        {
            await _storageService.DeleteAsync(userId, notificationId);
            return Ok(new { message = "Notification deleted" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting notification {NotificationId} for user {UserId}", notificationId, userId);
            return StatusCode(500, new { error = "Failed to delete notification" });
        }
    }
}

public record MarkReadRequest(
    [property: Required(ErrorMessage = "Список ID уведомлений обязателен")]
    [property: MinLength(1, ErrorMessage = "Необходимо указать хотя бы одно уведомление")]
    [property: MaxLength(100, ErrorMessage = "Нельзя пометить более 100 уведомлений за раз")]
    List<string> NotificationIds
);
