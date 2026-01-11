using TaskService.Domain.Enums;

namespace TaskService.Domain.Entities;

public class TaskItem
{
    private TaskItem()
    {
    }

    private TaskItem(
        Guid id,
        string title,
        string? description,
        string createdByUserId,
        DateTime createdAt,
        TaskEvidenceRequirement evidenceRequirement,
        int difficulty,
        int rewardXp,
        int rewardPoints)
    {
        Id = id;
        Title = title;
        Description = description;
        CreatedByUserId = createdByUserId;
        CreatedAt = createdAt;
        EvidenceRequirement = evidenceRequirement;
        Difficulty = difficulty;
        RewardXp = rewardXp;
        RewardPoints = rewardPoints;
    }

    public Guid Id { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public bool Completed { get; private set; }
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; private set; }
    public string CreatedByUserId { get; private set; } = string.Empty;
    public TaskEvidenceRequirement EvidenceRequirement { get; private set; } = TaskEvidenceRequirement.None;
    public string? EvidenceStoragePath { get; private set; }
    public string? EvidenceFileName { get; private set; }
    public string? EvidenceContentType { get; private set; }
    public long? EvidenceFileSize { get; private set; }
    public DateTime? EvidenceUploadedAt { get; private set; }
    public string? EvidenceUploadedBy { get; private set; }

    // Difficulty (1..5) and computed rewards (server-side)
    public int Difficulty { get; private set; } = 2;
    public int RewardXp { get; private set; } = 60 + 20 * 2;
    public int RewardPoints { get; private set; } = 5;

    private static readonly Dictionary<int, int> DIFFICULTY_POINTS = new()
    {
        { 1, 2 },
        { 2, 5 },
        { 3, 10 },
        { 4, 20 },
        { 5, 50 },
    };

    public bool RequiresEvidence => EvidenceRequirement != TaskEvidenceRequirement.None;
    public bool EvidenceSubmitted => !string.IsNullOrWhiteSpace(EvidenceStoragePath);

    public static TaskItem Create(
        string title,
        string? description,
        string createdByUserId,
        DateTime createdAt,
        TaskEvidenceRequirement evidenceRequirement,
        int? difficulty = null)
    {
        if (string.IsNullOrWhiteSpace(title))
            throw new ArgumentException("Title is required", nameof(title));
        if (string.IsNullOrWhiteSpace(createdByUserId))
            throw new ArgumentException("CreatedByUserId is required", nameof(createdByUserId));

        var d = difficulty ?? 2;
        if (d < 1 || d > 5) throw new ArgumentOutOfRangeException(nameof(difficulty));

        var rewardXp = 60 + 20 * d;
        var rewardPoints = DIFFICULTY_POINTS.ContainsKey(d) ? DIFFICULTY_POINTS[d] : 0;

        return new TaskItem(
            Guid.NewGuid(),
            title.Trim(),
            description?.Trim(),
            createdByUserId.Trim(),
            createdAt,
            evidenceRequirement,
            d,
            rewardXp,
            rewardPoints);
    }

    public void UpdateDifficulty(int difficulty)
    {
        if (difficulty < 1 || difficulty > 5) throw new ArgumentOutOfRangeException(nameof(difficulty));
        Difficulty = difficulty;
        RewardXp = 60 + 20 * difficulty;
        RewardPoints = DIFFICULTY_POINTS.ContainsKey(difficulty) ? DIFFICULTY_POINTS[difficulty] : 0;
    }

    public void UpdateDetails(string? title, string? description)
    {
        if (!string.IsNullOrWhiteSpace(title))
            Title = title.Trim();

        if (description is not null)
            Description = description.Trim();
    }

    public void UpdateEvidenceRequirement(TaskEvidenceRequirement requirement)
    {
        EvidenceRequirement = requirement;
        if (!RequiresEvidence)
        {
            ClearEvidence();
        }
    }

    public void SetCompletion(bool completed, DateTime when)
    {
        Completed = completed;
        CompletedAt = completed ? when : null;
    }

    public void AttachEvidence(
        string storagePath,
        string originalFileName,
        string contentType,
        long fileSize,
        DateTime uploadedAt,
        string uploadedBy)
    {
        if (!RequiresEvidence)
            throw new InvalidOperationException("Evidence is not required for this task.");
        if (string.IsNullOrWhiteSpace(storagePath))
            throw new ArgumentException("Storage path is required", nameof(storagePath));
        if (string.IsNullOrWhiteSpace(originalFileName))
            throw new ArgumentException("File name is required", nameof(originalFileName));
        if (string.IsNullOrWhiteSpace(contentType))
            throw new ArgumentException("Content type is required", nameof(contentType));
        if (fileSize <= 0)
            throw new ArgumentException("File size must be positive", nameof(fileSize));
        if (string.IsNullOrWhiteSpace(uploadedBy))
            throw new ArgumentException("Uploader identifier is required", nameof(uploadedBy));

        EvidenceStoragePath = storagePath;
        EvidenceFileName = originalFileName;
        EvidenceContentType = contentType;
        EvidenceFileSize = fileSize;
        EvidenceUploadedAt = uploadedAt;
        EvidenceUploadedBy = uploadedBy;
    }

    public void ClearEvidence()
    {
        EvidenceStoragePath = null;
        EvidenceFileName = null;
        EvidenceContentType = null;
        EvidenceFileSize = null;
        EvidenceUploadedAt = null;
        EvidenceUploadedBy = null;
    }
}
