using NotificationService.Domain.Models;

namespace NotificationService.Application.Services;

/// <summary>
/// Сервис хранения уведомлений
/// </summary>
public interface INotificationStorageService
{
    Task<IEnumerable<StoredNotification>> GetAllAsync(string userId);
    Task<IEnumerable<StoredNotification>> GetUnreadAsync(string userId);
    Task<int> GetUnreadCountAsync(string userId);
    Task<StoredNotification> CreateAsync(StoredNotification notification);
    Task MarkAsReadAsync(string userId, IEnumerable<Guid> notificationIds);
    Task MarkAllAsReadAsync(string userId);
    Task DeleteAsync(string userId, Guid notificationId);
}

/// <summary>
/// In-memory реализация хранилища уведомлений (для демонстрации)
/// В продакшене заменить на PostgreSQL/Redis
/// </summary>
public class InMemoryNotificationStorageService : INotificationStorageService
{
    private readonly List<StoredNotification> _notifications = new();
    private readonly object _lock = new();

    public Task<IEnumerable<StoredNotification>> GetAllAsync(string userId)
    {
        lock (_lock)
        {
            var result = _notifications
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .ToList();
            return Task.FromResult<IEnumerable<StoredNotification>>(result);
        }
    }

    public Task<IEnumerable<StoredNotification>> GetUnreadAsync(string userId)
    {
        lock (_lock)
        {
            var result = _notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .OrderByDescending(n => n.CreatedAt)
                .ToList();
            return Task.FromResult<IEnumerable<StoredNotification>>(result);
        }
    }

    public Task<int> GetUnreadCountAsync(string userId)
    {
        lock (_lock)
        {
            var count = _notifications.Count(n => n.UserId == userId && !n.IsRead);
            return Task.FromResult(count);
        }
    }

    public Task<StoredNotification> CreateAsync(StoredNotification notification)
    {
        lock (_lock)
        {
            notification.Id = Guid.NewGuid();
            notification.CreatedAt = DateTime.UtcNow;
            _notifications.Add(notification);
            return Task.FromResult(notification);
        }
    }

    public Task MarkAsReadAsync(string userId, IEnumerable<Guid> notificationIds)
    {
        var ids = notificationIds.ToHashSet();
        lock (_lock)
        {
            foreach (var notification in _notifications.Where(n => n.UserId == userId && ids.Contains(n.Id)))
            {
                notification.IsRead = true;
            }
        }
        return Task.CompletedTask;
    }

    public Task MarkAllAsReadAsync(string userId)
    {
        lock (_lock)
        {
            foreach (var notification in _notifications.Where(n => n.UserId == userId))
            {
                notification.IsRead = true;
            }
        }
        return Task.CompletedTask;
    }

    public Task DeleteAsync(string userId, Guid notificationId)
    {
        lock (_lock)
        {
            _notifications.RemoveAll(n => n.UserId == userId && n.Id == notificationId);
        }
        return Task.CompletedTask;
    }
}
