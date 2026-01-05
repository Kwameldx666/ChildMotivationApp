using FluentValidation;

namespace TaskService.Application.Features.Tasks.Commands.CreateTask;

public class CreateTaskCommandValidator : AbstractValidator<CreateTaskCommand>
{
    public CreateTaskCommandValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty()
            .MaximumLength(256);

        RuleFor(x => x.Description)
            .MaximumLength(2000)
            .When(x => !string.IsNullOrWhiteSpace(x.Description));

        RuleFor(x => x.CreatedByUserId)
            .NotEmpty()
            .MaximumLength(64);

        RuleFor(x => x.EvidenceRequirement)
            .IsInEnum();
    }
}
