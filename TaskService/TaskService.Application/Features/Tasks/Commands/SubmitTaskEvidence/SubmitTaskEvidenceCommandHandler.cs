using System.Globalization;
using FluentValidation;
using FluentValidation.Results;
using MediatR;
using TaskService.Application.Abstractions;
using TaskService.Application.Common.Exceptions;
using TaskService.Application.Dto.Tasks;
using TaskService.Application.Mappings;
using TaskService.Domain.Enums;
using TaskService.Domain.Repositories;

namespace TaskService.Application.Features.Tasks.Commands.SubmitTaskEvidence;

public class SubmitTaskEvidenceCommandHandler : IRequestHandler<SubmitTaskEvidenceCommand, TaskDto>
{
    private static readonly string[] PhotoExtensions = [".jpg", ".jpeg", ".png", ".webp"];
    private static readonly string[] VideoExtensions = [".mp4", ".mov", ".webm"];
    private static readonly string[] DocumentExtensions = [".pdf", ".doc", ".docx", ".txt"];

    private readonly ITaskRepository _repository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITaskEvidenceStorage _storage;
    private readonly IDateTimeProvider _dateTimeProvider;

    public SubmitTaskEvidenceCommandHandler(
        ITaskRepository repository,
        IUnitOfWork unitOfWork,
        ITaskEvidenceStorage storage,
        IDateTimeProvider dateTimeProvider)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
        _storage = storage;
        _dateTimeProvider = dateTimeProvider;
    }

    public async Task<TaskDto> Handle(SubmitTaskEvidenceCommand request, CancellationToken cancellationToken)
    {
        var task = await _repository.GetByIdAsync(request.TaskId, cancellationToken);
        if (task is null)
        {
            throw new NotFoundException(nameof(task), request.TaskId);
        }

        if (!task.RequiresEvidence)
        {
            throw BuildValidationException("Эта задача не требует подтверждения.");
        }

        ValidateEvidence(task.EvidenceRequirement, request.ContentType, request.FileName);

        await using var contentStream = new MemoryStream(request.Content, writable: false);
        var (storagePath, fileSize) = await _storage.SaveAsync(contentStream, request.FileName, cancellationToken);

        if (!string.IsNullOrWhiteSpace(task.EvidenceStoragePath))
        {
            await _storage.DeleteAsync(task.EvidenceStoragePath, cancellationToken);
        }

        task.AttachEvidence(
            storagePath,
            request.FileName,
            request.ContentType,
            fileSize,
            _dateTimeProvider.UtcNow,
            request.UploadedByUserId);

        await _repository.UpdateAsync(task, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return task.ToDto();
    }

    private static void ValidateEvidence(TaskEvidenceRequirement requirement, string contentType, string fileName)
    {
        var normalizedContentType = contentType?.Trim().ToLowerInvariant() ?? string.Empty;
        var extension = Path.GetExtension(fileName)?.ToLowerInvariant() ?? string.Empty;

        switch (requirement)
        {
            case TaskEvidenceRequirement.Photo:
                if (!normalizedContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase) || !PhotoExtensions.Contains(extension, StringComparer.OrdinalIgnoreCase))
                {
                    throw BuildValidationException("Прикрепите фотографию в форматах JPG, JPEG, PNG или WEBP.");
                }
                break;
            case TaskEvidenceRequirement.Video:
                if (!normalizedContentType.StartsWith("video/", StringComparison.OrdinalIgnoreCase) || !VideoExtensions.Contains(extension, StringComparer.OrdinalIgnoreCase))
                {
                    throw BuildValidationException("Прикрепите видео в форматах MP4, MOV или WEBM.");
                }
                break;
            case TaskEvidenceRequirement.Document:
                if (!IsDocumentContentType(normalizedContentType) || !DocumentExtensions.Contains(extension, StringComparer.OrdinalIgnoreCase))
                {
                    throw BuildValidationException("Прикрепите документ (PDF, DOC, DOCX или TXT).");
                }
                break;
            default:
                throw BuildValidationException("Неизвестный тип подтверждения для задачи.");
        }
    }

    private static bool IsDocumentContentType(string contentType)
    {
        if (string.IsNullOrWhiteSpace(contentType))
        {
            return false;
        }

        return contentType.StartsWith("application/", StringComparison.OrdinalIgnoreCase)
               || contentType.Equals("text/plain", StringComparison.OrdinalIgnoreCase);
    }

    private static ValidationException BuildValidationException(string message)
    {
        return new ValidationException(new[]
        {
            new ValidationFailure("Evidence", message)
        });
    }
}
