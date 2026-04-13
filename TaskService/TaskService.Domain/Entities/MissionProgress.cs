namespace TaskService.Domain.Entities;

public class MissionProgress
{
    private MissionProgress()
    {
    }

    public Guid Id { get; private set; }
    public Guid MissionId { get; private set; }
    public Mission Mission { get; private set; } = null!;
    public string UserId { get; private set; } = string.Empty;
    public int ProgressValue { get; private set; }
    public DateTime AnchorDate { get; private set; }
    public DateTime UpdatedAt { get; private set; }
    public DateTime? CompletedAt { get; private set; }

    public bool IsCompleted => CompletedAt.HasValue;

    public static MissionProgress Create(Guid missionId, string userId, DateTime anchorDate, DateTime createdAt)
    {
        if (missionId == Guid.Empty) throw new ArgumentException("Mission identifier is required", nameof(missionId));
        if (string.IsNullOrWhiteSpace(userId)) throw new ArgumentException("User identifier is required", nameof(userId));

        return new MissionProgress
        {
            Id = Guid.NewGuid(),
            MissionId = missionId,
            UserId = userId.Trim().ToLowerInvariant(),
            AnchorDate = anchorDate.Date,
            UpdatedAt = createdAt,
            ProgressValue = 0
        };
    }

    public bool ResetIfExpired(DateTime anchorDate)
    {
        anchorDate = anchorDate.Date;
        if (AnchorDate == anchorDate)
        {
            return false;
        }

        AnchorDate = anchorDate;
        ProgressValue = 0;
        CompletedAt = null;
        UpdatedAt = anchorDate;
        return true;
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
            CompletedAt = occurredAt;
        }
        else if (delta < 0)
        {
            CompletedAt = null;
        }

        return changed;
    }
}
