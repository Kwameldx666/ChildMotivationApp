using FluentValidation;

namespace TaskService.Application.Features.Tasks.Queries.GetTasks;

public class GetTasksQueryValidator : AbstractValidator<GetTasksQuery>
{
    public GetTasksQueryValidator()
    {
        RuleFor(x => x.CreatedByUserId)
            .MaximumLength(64)
            .When(x => !string.IsNullOrWhiteSpace(x.CreatedByUserId));
    }
}
