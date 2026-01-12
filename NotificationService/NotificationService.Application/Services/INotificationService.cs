using NotificationService.Domain.Models;

namespace NotificationService.Application.Services;

public interface INotificationService
{
    Task SendTaskCreatedNotificationAsync(TaskNotification notification, string userId);
    Task SendTaskUpdatedNotificationAsync(TaskNotification notification, string userId);
    Task SendTaskCompletedNotificationAsync(TaskNotification notification, string userId);
    Task SendTaskAssignedNotificationAsync(TaskNotification notification, string userId);
    Task SendGeneralNotificationAsync(GeneralNotification notification, string userId);
}
