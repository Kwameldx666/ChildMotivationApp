using TaskService.Domain.Entities;
using TaskService.Domain.Enums;

namespace UnitTests;

public sealed class TaskItemTests
{
    [Fact]
    public void Create_ShouldComputeRewardsAndTrimFields()
    {
        var task = TaskItem.Create(
            title: "  Wash dishes  ",
            description: "  Kitchen sink  ",
            createdByUserId: "  parent-1  ",
            createdAt: DateTime.UtcNow,
            evidenceRequirement: TaskEvidenceRequirement.Photo,
            difficulty: 4,
            assignedToUserId: "  child-7  ");

        Assert.Equal("Wash dishes", task.Title);
        Assert.Equal("Kitchen sink", task.Description);
        Assert.Equal("parent-1", task.CreatedByUserId);
        Assert.Equal("child-7", task.AssignedToUserId);
        Assert.Equal(4, task.Difficulty);
        Assert.Equal(140, task.RewardXp);
        Assert.Equal(20, task.RewardPoints);
        Assert.True(task.RequiresEvidence);
    }

    [Fact]
    public void Create_ShouldThrow_ForInvalidDifficulty()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() =>
            TaskItem.Create("Title", null, "user-1", DateTime.UtcNow, TaskEvidenceRequirement.None, 0));
    }

    [Fact]
    public void AttachEvidence_AndUpdateEvidenceRequirement_ShouldClearEvidenceWhenNotRequired()
    {
        var task = TaskItem.Create(
            "Task",
            null,
            "parent",
            DateTime.UtcNow,
            TaskEvidenceRequirement.Photo,
            difficulty: 2);

        task.AttachEvidence(
            storagePath: "evidence/path",
            originalFileName: "photo.jpg",
            contentType: "image/jpeg",
            fileSize: 100,
            uploadedAt: DateTime.UtcNow,
            uploadedBy: "child-1");

        Assert.True(task.EvidenceSubmitted);

        task.UpdateEvidenceRequirement(TaskEvidenceRequirement.None);

        Assert.False(task.RequiresEvidence);
        Assert.False(task.EvidenceSubmitted);
        Assert.Null(task.EvidenceFileName);
    }

    [Fact]
    public void RequestApproval_ShouldThrow_WhenAlreadyCompleted()
    {
        var task = TaskItem.Create("Task", null, "parent", DateTime.UtcNow, TaskEvidenceRequirement.None);
        task.SetCompletion(true, DateTime.UtcNow);

        Assert.Throws<InvalidOperationException>(() => task.RequestApproval(DateTime.UtcNow));
    }
}
