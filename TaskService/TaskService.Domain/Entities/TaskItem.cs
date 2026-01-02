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
        TaskEvidenceRequirement evidenceRequirement)
    {
        Id = id;
        Title = title;
        Description = description;
        CreatedByUserId = createdByUserId;
        CreatedAt = createdAt;
        EvidenceRequirement = evidenceRequirement;
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

    public bool RequiresEvidence => EvidenceRequirement != TaskEvidenceRequirement.None;
    public bool EvidenceSubmitted => !string.IsNullOrWhiteSpace(EvidenceStoragePath);

    public static TaskItem Create(
        string title,
        string? description,
        string createdByUserId,
        DateTime createdAt,
        TaskEvidenceRequirement evidenceRequirement)
    {
        if (string.IsNullOrWhiteSpace(title))
            throw new ArgumentException("Title is required", nameof(title));
        if (string.IsNullOrWhiteSpace(createdByUserId))
            throw new ArgumentException("CreatedByUserId is required", nameof(createdByUserId));

        return new TaskItem(
            Guid.NewGuid(),
            title.Trim(),
            description?.Trim(),
            createdByUserId.Trim(),
            createdAt,
            evidenceRequirement);
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
