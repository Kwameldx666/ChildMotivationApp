using FluentValidation;

namespace TaskService.Application.Features.Tasks.Queries.GetTaskEvidence;

public class GetTaskEvidenceQueryValidator : AbstractValidator<GetTaskEvidenceQuery>
{
    public GetTaskEvidenceQueryValidator()
    {
        RuleFor(x => x.TaskId)
            .NotEmpty().WithMessage("Идентификатор задачи обязателен.");
    }
}
