using FluentValidation;

namespace TaskService.Application.Features.Comments.Queries.GetCommentsByTaskId;

public class GetCommentsByTaskIdQueryValidator : AbstractValidator<GetCommentsByTaskIdQuery>
{
    public GetCommentsByTaskIdQueryValidator()
    {
        RuleFor(x => x.TaskId)
            .NotEmpty().WithMessage("Идентификатор задачи обязателен.");
    }
}
