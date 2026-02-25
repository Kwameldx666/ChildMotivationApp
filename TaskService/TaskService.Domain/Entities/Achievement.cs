namespace TaskService.Domain.Entities;

public class Achievement
{
    private Achievement()
    {
    }

    public Guid Id { get; private set; }
    public string Code { get; private set; } = string.Empty;
    public string Title { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public string Icon { get; private set; } = "trophy";
    public int TargetValue { get; private set; }
    public int RewardXp { get; private set; }
    public bool IsHidden { get; private set; }
    public int SortOrder { get; private set; }
    public bool IsActive { get; private set; } = true;
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; private set; }

    public static Achievement Create(
        string code,
        string title,
        string description,
        string icon,
        int targetValue,
        int rewardXp,
        int sortOrder,
        bool isHidden,
        DateTime createdAt)
    {
        if (string.IsNullOrWhiteSpace(code)) throw new ArgumentException("Code is required", nameof(code));
        if (string.IsNullOrWhiteSpace(title)) throw new ArgumentException("Title is required", nameof(title));
        if (targetValue <= 0) throw new ArgumentOutOfRangeException(nameof(targetValue));
        if (rewardXp < 0) throw new ArgumentOutOfRangeException(nameof(rewardXp));

        return new Achievement
        {
            Id = Guid.NewGuid(),
            Code = NormalizeCode(code),
            Title = title.Trim(),
            Description = description?.Trim() ?? string.Empty,
            Icon = string.IsNullOrWhiteSpace(icon) ? "trophy" : icon.Trim().ToLowerInvariant(),
            TargetValue = targetValue,
            RewardXp = rewardXp,
            SortOrder = sortOrder,
            IsHidden = isHidden,
            CreatedAt = createdAt,
            UpdatedAt = createdAt
        };
    }

    public void UpdateDetails(string? title, string? description, string? icon, int? targetValue, int? rewardXp, bool? isHidden)
    {
        if (!string.IsNullOrWhiteSpace(title))
            Title = title.Trim();

        if (description is not null)
            Description = description.Trim();

        if (!string.IsNullOrWhiteSpace(icon))
            Icon = icon.Trim().ToLowerInvariant();

        if (targetValue.HasValue)
        {
            if (targetValue.Value <= 0) throw new ArgumentOutOfRangeException(nameof(targetValue));
            TargetValue = targetValue.Value;
        }

        if (rewardXp.HasValue)
        {
            if (rewardXp.Value < 0) throw new ArgumentOutOfRangeException(nameof(rewardXp));
            RewardXp = rewardXp.Value;
        }

        if (isHidden.HasValue)
        {
            IsHidden = isHidden.Value;
        }

        UpdatedAt = DateTime.UtcNow;
    }

    public void UpdateSortOrder(int sortOrder)
    {
        SortOrder = sortOrder;
        UpdatedAt = DateTime.UtcNow;
    }

    public void SetActive(bool isActive)
    {
        IsActive = isActive;
        UpdatedAt = DateTime.UtcNow;
    }

    public static string NormalizeCode(string value)
    {
        return value.Trim().Replace(' ', '-').ToLowerInvariant();
    }
}
