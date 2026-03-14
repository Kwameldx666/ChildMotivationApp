using Moq;
using NotificationService.Application.Services;
using NotificationService.Domain.Models;

namespace NotificationService.UnitTests;

public sealed class NotificationServiceAdditionalTests
{
    [Fact]
    public async Task SendTaskUpdatedNotificationAsync_ShouldPersistCorrectType_AndInvokeSender()
    {
        var sender = new Mock<INotificationSender>();
        var storage = new InMemoryNotificationStorageService();
        var service = new NotificationService.Application.Services.NotificationService(sender.Object, storage);

        var payload = new TaskNotification { Title = "Math homework" };
        await service.SendTaskUpdatedNotificationAsync(payload, "u-1");

        var stored = (await storage.GetAllAsync("u-1")).Single();
        Assert.Equal("task_updated", stored.Type);
        Assert.Contains("Math homework", stored.Message, StringComparison.Ordinal);

        sender.Verify(s => s.SendToUserAsync("u-1", "TaskUpdated", payload), Times.Once);
    }

    [Fact]
    public async Task SendTaskAssignedNotificationAsync_ShouldPersistAndSend()
    {
        var sender = new Mock<INotificationSender>();
        var storage = new InMemoryNotificationStorageService();
        var service = new NotificationService.Application.Services.NotificationService(sender.Object, storage);

        var payload = new TaskNotification { Title = "Clean desk" };
        await service.SendTaskAssignedNotificationAsync(payload, "u-2");

        var stored = (await storage.GetAllAsync("u-2")).Single();
        Assert.Equal("task_assigned", stored.Type);
        Assert.Equal("New Task Assigned", stored.Title);

        sender.Verify(s => s.SendToUserAsync("u-2", "TaskAssigned", payload), Times.Once);
    }

    [Fact]
    public async Task GetAllAsync_ShouldReturnNotifications_InDescendingCreationOrder()
    {
        var storage = new InMemoryNotificationStorageService();

        await storage.CreateAsync(new StoredNotification { UserId = "u-3", Title = "t1", Message = "m1" });
        await Task.Delay(5);
        await storage.CreateAsync(new StoredNotification { UserId = "u-3", Title = "t2", Message = "m2" });

        var all = (await storage.GetAllAsync("u-3")).ToList();

        Assert.Equal(2, all.Count);
        Assert.True(all[0].CreatedAt >= all[1].CreatedAt);
    }

    [Fact]
    public async Task MarkAsReadAsync_ShouldNotAffectAnotherUsersNotifications()
    {
        var storage = new InMemoryNotificationStorageService();

        var mine = await storage.CreateAsync(new StoredNotification { UserId = "u-4", Title = "mine", Message = "m" });
        await storage.CreateAsync(new StoredNotification { UserId = "u-5", Title = "other", Message = "o" });

        await storage.MarkAsReadAsync("u-4", new[] { mine.Id });

        var otherUnread = await storage.GetUnreadCountAsync("u-5");
        Assert.Equal(1, otherUnread);
    }

    [Fact]
    public async Task DeleteAsync_ShouldDeleteOnlyForSpecifiedUser()
    {
        var storage = new InMemoryNotificationStorageService();

        var n1 = await storage.CreateAsync(new StoredNotification { UserId = "u-6", Title = "a", Message = "a" });
        await storage.CreateAsync(new StoredNotification { UserId = "u-7", Title = "b", Message = "b" });

        await storage.DeleteAsync("u-6", n1.Id);

        Assert.Equal(0, await storage.GetUnreadCountAsync("u-6"));
        Assert.Equal(1, await storage.GetUnreadCountAsync("u-7"));
    }
}
