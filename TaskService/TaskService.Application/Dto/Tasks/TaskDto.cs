using TaskService.Domain.Enums;

namespace TaskService.Application.Dto.Tasks;

public record TaskDto(
    Guid Id,
    string Title,
    string? Description,
    bool Completed,
    DateTime CreatedAt,
    DateTime? CompletedAt,
    string CreatedByUserId,
    TaskEvidenceDto Evidence);

public record TaskEvidenceDto(
    TaskEvidenceRequirement Requirement,
    bool IsSubmitted,
    string? FileName,
    string? ContentType,
    long? FileSize,
    DateTime? UploadedAt,
    string? UploadedByUserId);
