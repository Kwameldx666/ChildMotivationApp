using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NotificationService.Application.Services;
using NotificationService.Domain.Models;

namespace NotificationService.Infrastructure.Persistence;

public class PostgresNotificationStorageService : INotificationStorageService
{
    private readonly NotificationDbContext _context;
    private readonly ILogger<PostgresNotificationStorageService> _logger;

    public PostgresNotificationStorageService(
        NotificationDbContext context,
        ILogger<PostgresNotificationStorageService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<IEnumerable<StoredNotification>> GetAllAsync(string userId)
    {
        return await _context.Notifications
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<StoredNotification>> GetUnreadAsync(string userId)
    {
        return await _context.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync();
    }

    public async Task<int> GetUnreadCountAsync(string userId)
    {
        return await _context.Notifications
            .CountAsync(n => n.UserId == userId && !n.IsRead);
    }

    public async Task<StoredNotification> CreateAsync(StoredNotification notification)
    {
        notification.Id = Guid.NewGuid();
        notification.CreatedAt = DateTime.UtcNow;
        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();
        _logger.LogInformation("Notification {NotificationId} created for user {UserId}", notification.Id,
            notification.UserId);
        return notification;
    }

    public async Task MarkAsReadAsync(string userId, IEnumerable<Guid> notificationIds)
    {
        var ids = notificationIds.ToList();
        await _context.Notifications
            .Where(n => n.UserId == userId && ids.Contains(n.Id))
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true));
    }

    public async Task MarkAllAsReadAsync(string userId)
    {
        await _context.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true));
    }

    public async Task DeleteAsync(string userId, Guid notificationId)
    {
        await _context.Notifications
            .Where(n => n.UserId == userId && n.Id == notificationId)
            .ExecuteDeleteAsync();
    }
}
