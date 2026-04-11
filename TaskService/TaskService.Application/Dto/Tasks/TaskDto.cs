using System.Diagnostics.CodeAnalysis;
using TaskService.Domain.Enums;

namespace TaskService.Application.Dto.Tasks;

[ExcludeFromCodeCoverage]

public record TaskDto(
    Guid Id,
    string Title,
    string? Description,
    bool Completed,
    bool PendingApproval,
    bool StartedByChild,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    DateTime? CompletedAt,
    string CreatedByUserId,
    int Difficulty,
    int RewardXp,
    int RewardPoints,
    TaskEvidenceDto Evidence);

[ExcludeFromCodeCoverage]

public record TaskEvidenceDto(
    TaskEvidenceRequirement Requirement,
    bool IsSubmitted,
    string? FileName,
    string? ContentType,
    long? FileSize,
    DateTime? UploadedAt,
    string? UploadedByUserId);


