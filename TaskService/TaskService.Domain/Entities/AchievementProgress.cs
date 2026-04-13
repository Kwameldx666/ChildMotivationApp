namespace TaskService.Domain.Entities;

public class AchievementProgress
{
    private AchievementProgress()
    {
    }

    public Guid Id { get; private set; }
    public Guid AchievementId { get; private set; }
    public Achievement Achievement { get; private set; } = null!;
    public string UserId { get; private set; } = string.Empty;
    public int ProgressValue { get; private set; }
    public DateTime UpdatedAt { get; private set; }
    public DateTime? UnlockedAt { get; private set; }

    public bool IsUnlocked => UnlockedAt.HasValue;

    public static AchievementProgress Create(Guid achievementId, string userId, DateTime createdAt)
    {
        if (achievementId == Guid.Empty) throw new ArgumentException("Achievement identifier is required", nameof(achievementId));
        if (string.IsNullOrWhiteSpace(userId)) throw new ArgumentException("User identifier is required", nameof(userId));

        return new AchievementProgress
        {
            Id = Guid.NewGuid(),
            AchievementId = achievementId,
            UserId = userId.Trim().ToLowerInvariant(),
            UpdatedAt = createdAt,
            ProgressValue = 0
        };
    }

    public bool ApplyDelta(int delta, int targetValue, DateTime occurredAt)
    {
        if (delta == 0)
        {
            return false;
        }

        if (targetValue <= 0)
        {
            targetValue = 1;
        }

        var nextValue = ProgressValue + delta;
        if (nextValue < 0)
        {
            nextValue = 0;
        }

        if (nextValue > targetValue)
        {
            nextValue = targetValue;
        }

        var changed = nextValue != ProgressValue;
        ProgressValue = nextValue;
        UpdatedAt = occurredAt;

        if (ProgressValue >= targetValue)
        {
            UnlockedAt ??= occurredAt;
        }
        else if (delta < 0)
        {
            UnlockedAt = null;
        }

        return changed;
    }
}
