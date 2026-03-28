namespace TaskService.Application.Abstractions;

public interface INotificationClient
{
    Task SendTaskCompletedNotificationAsync(
        string taskId,
        string title,
        string description,
        string[] userIds,
        CancellationToken cancellationToken = default);

    Task SendTaskAssignedNotificationAsync(
        string taskId,
        string title,
        string description,
        string assignedTo,
        string assignedBy,
        CancellationToken cancellationToken = default);

    Task SendTaskUpdatedNotificationAsync(
        string taskId,
        string title,
        string description,
        string[] userIds,
        string status,
        CancellationToken cancellationToken = default);

    Task SendNewCommentNotificationAsync(
        string taskId,
        string taskTitle,
        string commentAuthor,
        string[] userIds,
        CancellationToken cancellationToken = default);

    Task SendGeneralNotificationAsync(
        string userId,
        string title,
        string message,
        string type,
        Dictionary<string, object>? data = null,
        CancellationToken cancellationToken = default);
}
