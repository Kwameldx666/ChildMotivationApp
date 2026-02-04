using NotificationService.Domain.Models;

namespace NotificationService.Application.Services;

public interface INotificationSender
{
    Task SendToUserAsync<T>(string userId, string method, T data);
}

public class NotificationService : INotificationService
{
    private readonly INotificationSender _notificationSender;
    private readonly INotificationStorageService _storageService;

    public NotificationService(
        INotificationSender notificationSender,
        INotificationStorageService storageService)
    {
        _notificationSender = notificationSender;
        _storageService = storageService;
    }

    public async Task SendTaskCreatedNotificationAsync(TaskNotification notification, string userId)
    {
        await SaveNotificationAsync(userId, "task_created", "New Task", $"Task created: {notification.Title}");
        await SendToUserAsync(userId, "TaskCreated", notification);
    }

    public async Task SendTaskUpdatedNotificationAsync(TaskNotification notification, string userId)
    {
        await SaveNotificationAsync(userId, "task_updated", "Task Updated", $"Task updated: {notification.Title}");
        await SendToUserAsync(userId, "TaskUpdated", notification);
    }

    public async Task SendTaskCompletedNotificationAsync(TaskNotification notification, string userId)
    {
        await SaveNotificationAsync(userId, "task_completed", "Task Completed!", $"Task completed: {notification.Title}");
        await SendToUserAsync(userId, "TaskCompleted", notification);
    }

    public async Task SendTaskAssignedNotificationAsync(TaskNotification notification, string userId)
    {
        await SaveNotificationAsync(userId, "task_assigned", "New Task Assigned", $"Task assigned to you: {notification.Title}");
        await SendToUserAsync(userId, "TaskAssigned", notification);
    }

    public async Task SendGeneralNotificationAsync(GeneralNotification notification, string userId)
    {
        await SaveNotificationAsync(userId, notification.Type, notification.Title, notification.Message, notification.Data);
        await SendToUserAsync(userId, "GeneralNotification", notification);
    }

    private async Task SaveNotificationAsync(string userId, string type, string title, string message, Dictionary<string, object>? data = null)
    {
        var storedNotification = new StoredNotification
        {
            UserId = userId,
            Type = type,
            Title = title,
            Message = message,
            Data = data
        };
        await _storageService.CreateAsync(storedNotification);
    }

    private async Task SendToUserAsync<T>(string userId, string method, T data)
    {
        await _notificationSender.SendToUserAsync(userId, method, data);
    }
}
