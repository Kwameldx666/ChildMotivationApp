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

    Task SendNewCommentNotificationAsync(
        string taskId,
        string taskTitle,
        string commentAuthor,
        string[] userIds,
        CancellationToken cancellationToken = default);
}
