using NotificationService.Application.Services;
using NotificationService.Domain.Models;

namespace NotificationService.UnitTests;

public sealed class NotificationStorageTests
{
    [Fact]
    public async Task CreateAndUnreadCount_ShouldWork()
    {
        var storage = new InMemoryNotificationStorageService();

        await storage.CreateAsync(new StoredNotification { UserId = "u1", Title = "t", Message = "m" });
        await storage.CreateAsync(new StoredNotification { UserId = "u1", Title = "t2", Message = "m2" });

        var unreadCount = await storage.GetUnreadCountAsync("u1");

        Assert.Equal(2, unreadCount);
    }

    [Fact]
    public async Task MarkAllAsRead_ShouldSetUnreadCountToZero()
    {
        var storage = new InMemoryNotificationStorageService();
        await storage.CreateAsync(new StoredNotification { UserId = "u2", Title = "t", Message = "m" });

        await storage.MarkAllAsReadAsync("u2");

        var unreadCount = await storage.GetUnreadCountAsync("u2");
        Assert.Equal(0, unreadCount);
    }
}
