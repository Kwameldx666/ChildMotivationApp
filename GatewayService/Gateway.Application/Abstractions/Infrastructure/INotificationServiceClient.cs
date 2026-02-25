namespace Gateway.Application.Abstractions.Infrastructure;

public interface INotificationServiceClient
{
    /// <summary>
    ///     Get all user notifications
    /// </summary>
    Task<HttpResponseMessage> GetAllAsync(string userId, CancellationToken cancellationToken = default);

    /// <summary>
    ///     Get unread user notifications
    /// </summary>
    Task<HttpResponseMessage> GetUnreadAsync(string userId, CancellationToken cancellationToken = default);

    /// <summary>
    ///     Get count of unread notifications
    /// </summary>
    Task<HttpResponseMessage> GetUnreadCountAsync(string userId, CancellationToken cancellationToken = default);

    /// <summary>
    ///     Mark notifications as read
    /// </summary>
    Task<HttpResponseMessage> MarkAsReadAsync(string userId, List<string> notificationIds,
        CancellationToken cancellationToken = default);

    /// <summary>
    ///     Mark all user notifications as read
    /// </summary>
    Task<HttpResponseMessage> MarkAllAsReadAsync(string userId, CancellationToken cancellationToken = default);

    /// <summary>
    ///     Delete notification
    /// </summary>
    Task<HttpResponseMessage> DeleteAsync(string userId, Guid notificationId,
        CancellationToken cancellationToken = default);

    /// <summary>
    ///     Send a task notification (fire-and-forget from gateway)
    /// </summary>
    Task<HttpResponseMessage> SendTaskNotificationAsync(string endpoint, object request,
        CancellationToken cancellationToken = default);

    /// <summary>
    ///     Send a general notification
    /// </summary>
    Task<HttpResponseMessage> SendGeneralNotificationAsync(object request,
        CancellationToken cancellationToken = default);
}