using Moq;
using NotificationService.Application.Services;
using NotificationService.Domain.Models;

namespace UnitTests;

public sealed class NotificationServiceTests
{
    [Fact]
    public async Task SendTaskCreatedNotificationAsync_ShouldPersistAndSend()
    {
        var sender = new Mock<INotificationSender>();
        var storage = new InMemoryNotificationStorageService();
        var service = new NotificationService.Application.Services.NotificationService(sender.Object, storage);

        var userId = "user-1";
        var payload = new TaskNotification { Title = "Clean room" };

        await service.SendTaskCreatedNotificationAsync(payload, userId);

        var all = (await storage.GetAllAsync(userId)).ToList();

        Assert.Single(all);
        Assert.Equal("task_created", all[0].Type);
        Assert.Equal("New Task", all[0].Title);
        Assert.Contains("Clean room", all[0].Message, StringComparison.Ordinal);

        sender.Verify(s => s.SendToUserAsync(userId, "TaskCreated", payload), Times.Once);
    }

    [Fact]
    public async Task InMemoryStorage_ShouldMarkNotificationsAsRead()
    {
        var storage = new InMemoryNotificationStorageService();
        var userId = "user-2";

        var created1 = await storage.CreateAsync(new StoredNotification { UserId = userId, Message = "m1", Title = "t1" });
        var created2 = await storage.CreateAsync(new StoredNotification { UserId = userId, Message = "m2", Title = "t2" });

        await storage.MarkAsReadAsync(userId, new[] { created1.Id });

        var unread = (await storage.GetUnreadAsync(userId)).ToList();
        Assert.Single(unread);
        Assert.Equal(created2.Id, unread[0].Id);

        await storage.MarkAllAsReadAsync(userId);

        var unreadCount = await storage.GetUnreadCountAsync(userId);
        Assert.Equal(0, unreadCount);
    }

    [Fact]
    public async Task SendGeneralNotificationAsync_ShouldPersistCustomTypeAndData()
    {
        var sender = new Mock<INotificationSender>();
        var storage = new InMemoryNotificationStorageService();
        var service = new NotificationService.Application.Services.NotificationService(sender.Object, storage);

        var userId = "user-3";
        var payload = new GeneralNotification
        {
            Type = "reward_available",
            Title = "Reward",
            Message = "You can buy a reward now",
            Data = new Dictionary<string, object> { ["points"] = 100 }
        };

        await service.SendGeneralNotificationAsync(payload, userId);

        var stored = (await storage.GetAllAsync(userId)).Single();
        Assert.Equal("reward_available", stored.Type);
        Assert.Equal("Reward", stored.Title);
        Assert.NotNull(stored.Data);
        Assert.True(stored.Data!.ContainsKey("points"));

        sender.Verify(s => s.SendToUserAsync(userId, "GeneralNotification", payload), Times.Once);
    }

    [Fact]
    public async Task InMemoryStorage_DeleteAsync_ShouldRemoveNotification()
    {
        var storage = new InMemoryNotificationStorageService();
        var userId = "user-4";

        var created = await storage.CreateAsync(new StoredNotification { UserId = userId, Message = "m", Title = "t" });
        await storage.DeleteAsync(userId, created.Id);

        var all = await storage.GetAllAsync(userId);
        Assert.Empty(all);
    }
}
