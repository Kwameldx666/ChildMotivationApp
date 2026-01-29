namespace Gateway.Application.Abstractions.Infrastructure;

public interface INotificationServiceClient
{
    /// <summary>
    /// Получить все уведомления пользователя
    /// </summary>
    Task<HttpResponseMessage> GetAllAsync(string userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Получить непрочитанные уведомления пользователя
    /// </summary>
    Task<HttpResponseMessage> GetUnreadAsync(string userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Получить количество непрочитанных уведомлений
    /// </summary>
    Task<HttpResponseMessage> GetUnreadCountAsync(string userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Отметить уведомления как прочитанные
    /// </summary>
    Task<HttpResponseMessage> MarkAsReadAsync(string userId, List<string> notificationIds, CancellationToken cancellationToken = default);

    /// <summary>
    /// Отметить все уведомления пользователя как прочитанные
    /// </summary>
    Task<HttpResponseMessage> MarkAllAsReadAsync(string userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Удалить уведомление
    /// </summary>
    Task<HttpResponseMessage> DeleteAsync(string userId, Guid notificationId, CancellationToken cancellationToken = default);
}
