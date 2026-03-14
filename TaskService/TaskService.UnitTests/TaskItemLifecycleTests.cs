using TaskService.Domain.Entities;
using TaskService.Domain.Enums;

namespace TaskService.UnitTests;

public sealed class TaskItemLifecycleTests
{
    [Fact]
    public void UpdateDifficulty_ShouldRecalculateRewards_AndSetUpdatedAt()
    {
        var task = TaskItem.Create("Task", "Desc", "parent", DateTime.UtcNow, TaskEvidenceRequirement.None, difficulty: 1);

        task.UpdateDifficulty(5);

        Assert.Equal(5, task.Difficulty);
        Assert.Equal(160, task.RewardXp);
        Assert.Equal(50, task.RewardPoints);
        Assert.NotNull(task.UpdatedAt);
    }

    [Fact]
    public void UpdateDetails_ShouldTrimValues_WhenProvided()
    {
        var task = TaskItem.Create("Task", "Desc", "parent", DateTime.UtcNow, TaskEvidenceRequirement.None, difficulty: 2);

        task.UpdateDetails("  New title  ", "  New description  ");

        Assert.Equal("New title", task.Title);
        Assert.Equal("New description", task.Description);
    }

    [Fact]
    public void UpdateDetails_ShouldKeepDescription_WhenNullPassed()
    {
        var task = TaskItem.Create("Task", "Initial", "parent", DateTime.UtcNow, TaskEvidenceRequirement.None, difficulty: 2);

        task.UpdateDetails("Updated", null);

        Assert.Equal("Updated", task.Title);
        Assert.Equal("Initial", task.Description);
    }

    [Fact]
    public void RequestApproval_AndRejectApproval_ShouldTogglePendingFlag()
    {
        var when = DateTime.UtcNow;
        var task = TaskItem.Create("Task", null, "parent", DateTime.UtcNow, TaskEvidenceRequirement.None);

        task.RequestApproval(when);
        Assert.True(task.PendingApproval);
        Assert.Equal(when, task.UpdatedAt);

        var rejectTime = when.AddMinutes(2);
        task.RejectApproval(rejectTime);

        Assert.False(task.PendingApproval);
        Assert.Equal(rejectTime, task.UpdatedAt);
    }

    [Fact]
    public void AttachEvidence_ShouldThrow_WhenEvidenceNotRequired()
    {
        var task = TaskItem.Create("Task", null, "parent", DateTime.UtcNow, TaskEvidenceRequirement.None);

        Assert.Throws<InvalidOperationException>(() => task.AttachEvidence(
            "path",
            "f.png",
            "image/png",
            12,
            DateTime.UtcNow,
            "child"));
    }

    [Fact]
    public void AttachEvidence_ShouldThrow_WhenFileSizeIsNotPositive()
    {
        var task = TaskItem.Create("Task", null, "parent", DateTime.UtcNow, TaskEvidenceRequirement.Photo);

        Assert.Throws<ArgumentException>(() => task.AttachEvidence(
            "path",
            "f.png",
            "image/png",
            0,
            DateTime.UtcNow,
            "child"));
    }
}
