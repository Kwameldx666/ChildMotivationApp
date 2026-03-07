using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using NotificationService.Application.Services;
using NotificationService.Domain.Models;

namespace NotificationService.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;
    private readonly ILogger<NotificationsController> _logger;

    public NotificationsController(
        INotificationService notificationService,
        ILogger<NotificationsController> logger)
    {
        _notificationService = notificationService;
        _logger = logger;
    }

    [HttpPost("task/created")]
    public async Task<IActionResult> SendTaskCreatedNotification([FromBody] TaskNotificationRequest request)
    {
        try
        {
            var notification = new TaskNotification
            {
                TaskId = request.TaskId,
                Title = request.Title,
                Description = request.Description,
                AssignedTo = request.AssignedTo,
                AssignedBy = request.AssignedBy,
                CreatedAt = DateTime.UtcNow,
                DueDate = request.DueDate,
                Priority = request.Priority ?? "Medium",
                Status = "Pending"
            };

            await _notificationService.SendTaskCreatedNotificationAsync(notification, request.UserId);
            
            return Ok(new { message = "Notification sent successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending task created notification");
            return StatusCode(500, new { error = "Failed to send notification" });
        }
    }

    [HttpPost("task/updated")]
    public async Task<IActionResult> SendTaskUpdatedNotification([FromBody] TaskNotificationRequest request)
    {
        try
        {
            var notification = new TaskNotification
            {
                TaskId = request.TaskId,
                Title = request.Title,
                Description = request.Description,
                AssignedTo = request.AssignedTo,
                AssignedBy = request.AssignedBy,
                CreatedAt = DateTime.UtcNow,
                Status = request.Status ?? "Updated"
            };

            await _notificationService.SendTaskUpdatedNotificationAsync(notification, request.UserId);
            
            return Ok(new { message = "Notification sent successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending task updated notification");
            return StatusCode(500, new { error = "Failed to send notification" });
        }
    }

    [HttpPost("task/completed")]
    public async Task<IActionResult> SendTaskCompletedNotification([FromBody] TaskNotificationRequest request)
    {
        try
        {
            var notification = new TaskNotification
            {
                TaskId = request.TaskId,
                Title = request.Title,
                Description = request.Description,
                AssignedTo = request.AssignedTo,
                AssignedBy = request.AssignedBy,
                CreatedAt = DateTime.UtcNow,
                Status = "Completed"
            };

            await _notificationService.SendTaskCompletedNotificationAsync(notification, request.UserId);
            
            return Ok(new { message = "Notification sent successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending task completed notification");
            return StatusCode(500, new { error = "Failed to send notification" });
        }
    }

    [HttpPost("task/assigned")]
    public async Task<IActionResult> SendTaskAssignedNotification([FromBody] TaskNotificationRequest request)
    {
        try
        {
            var notification = new TaskNotification
            {
                TaskId = request.TaskId,
                Title = request.Title,
                Description = request.Description,
                AssignedTo = request.AssignedTo,
                AssignedBy = request.AssignedBy,
                CreatedAt = DateTime.UtcNow,
                DueDate = request.DueDate,
                Priority = request.Priority ?? "Medium",
                Status = "Assigned"
            };

            await _notificationService.SendTaskAssignedNotificationAsync(notification, request.UserId);
            
            return Ok(new { message = "Notification sent successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending task assigned notification");
            return StatusCode(500, new { error = "Failed to send notification" });
        }
    }

    [HttpPost("general")]
    public async Task<IActionResult> SendGeneralNotification([FromBody] GeneralNotificationRequest request)
    {
        try
        {
            var notification = new GeneralNotification
            {
                Title = request.Title,
                Message = request.Message,
                Type = request.Type ?? "Info",
                Data = request.Data
            };

            await _notificationService.SendGeneralNotificationAsync(notification, request.UserId);
            
            return Ok(new { message = "Notification sent successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending general notification");
            return StatusCode(500, new { error = "Failed to send notification" });
        }
    }
}

public record TaskNotificationRequest(
    [property: Required(ErrorMessage = "ID пользователя обязателен")]
    [property: StringLength(64)]
    string UserId,
    [property: Required(ErrorMessage = "ID задачи обязателен")]
    [property: StringLength(64)]
    string TaskId,
    [property: Required(ErrorMessage = "Заголовок обязателен")]
    [property: StringLength(256)]
    string Title,
    [property: StringLength(2000)]
    string Description,
    [property: StringLength(64)]
    string AssignedTo,
    [property: StringLength(64)]
    string AssignedBy,
    DateTime? DueDate = null,
    [property: StringLength(32)]
    string? Priority = null,
    [property: StringLength(64)]
    string? Status = null
);

public record GeneralNotificationRequest(
    [property: Required(ErrorMessage = "ID пользователя обязателен")]
    [property: StringLength(64)]
    string UserId,
    [property: Required(ErrorMessage = "Заголовок обязателен")]
    [property: StringLength(256)]
    string Title,
    [property: Required(ErrorMessage = "Сообщение обязательно")]
    [property: StringLength(2000)]
    string Message,
    [property: StringLength(32)]
    string? Type = null,
    Dictionary<string, object>? Data = null
);
