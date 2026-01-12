using NotificationService.Domain.Models;

namespace NotificationService.Application.Services;

public interface INotificationSender
{
    Task SendToUserAsync<T>(string userId, string method, T data);
}

public class NotificationService : INotificationService
{
    private readonly INotificationSender _notificationSender;

    public NotificationService(
        INotificationSender notificationSender)
    {
        _notificationSender = notificationSender;
    }

    public async Task SendTaskCreatedNotificationAsync(TaskNotification notification, string userId)
    {
        await SendToUserAsync(userId, "TaskCreated", notification);
    }

    public async Task SendTaskUpdatedNotificationAsync(TaskNotification notification, string userId)
    {
        await SendToUserAsync(userId, "TaskUpdated", notification);
    }

    public async Task SendTaskCompletedNotificationAsync(TaskNotification notification, string userId)
    {
        await SendToUserAsync(userId, "TaskCompleted", notification);
    }

    public async Task SendTaskAssignedNotificationAsync(TaskNotification notification, string userId)
    {
        await SendToUserAsync(userId, "TaskAssigned", notification);
    }

    public async Task SendGeneralNotificationAsync(GeneralNotification notification, string userId)
    {
        await SendToUserAsync(userId, "GeneralNotification", notification);
    }

    private async Task SendToUserAsync<T>(string userId, string method, T data)
    {
        await _notificationSender.SendToUserAsync(userId, method, data);
    }
}
