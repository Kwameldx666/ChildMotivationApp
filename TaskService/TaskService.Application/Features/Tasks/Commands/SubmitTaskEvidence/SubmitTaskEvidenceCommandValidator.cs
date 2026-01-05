using FluentValidation;

namespace TaskService.Application.Features.Tasks.Commands.SubmitTaskEvidence;

public class SubmitTaskEvidenceCommandValidator : AbstractValidator<SubmitTaskEvidenceCommand>
{
    private const int MaxEvidenceBytes = 25 * 1024 * 1024; // 25 MB ceiling

    public SubmitTaskEvidenceCommandValidator()
    {
        RuleFor(x => x.TaskId)
            .NotEmpty();

        RuleFor(x => x.UploadedByUserId)
            .NotEmpty()
            .MaximumLength(64);

        RuleFor(x => x.FileName)
            .NotEmpty()
            .MaximumLength(256);

        RuleFor(x => x.ContentType)
            .NotEmpty()
            .MaximumLength(256);

        RuleFor(x => x.Content)
            .NotEmpty()
            .Must(bytes => bytes.Length <= MaxEvidenceBytes)
            .WithMessage($"Максимальный размер файла {MaxEvidenceBytes / (1024 * 1024)} МБ.");
    }
}
