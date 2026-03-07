using FluentValidation;

namespace TaskService.Application.Features.Comments.Commands.CreateComment;

public class CreateCommentCommandValidator : AbstractValidator<CreateCommentCommand>
{
    public CreateCommentCommandValidator()
    {
        RuleFor(x => x.TaskId)
            .NotEmpty().WithMessage("Идентификатор задачи обязателен.");

        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("Идентификатор пользователя обязателен.")
            .MaximumLength(64);

        RuleFor(x => x.UserName)
            .NotEmpty().WithMessage("Имя пользователя обязательно.")
            .MaximumLength(256);

        RuleFor(x => x.UserRole)
            .NotEmpty().WithMessage("Роль пользователя обязательна.")
            .MaximumLength(64);

        RuleFor(x => x.Content)
            .NotEmpty().WithMessage("Комментарий не может быть пустым.")
            .MaximumLength(2000).WithMessage("Комментарий не может превышать 2000 символов.");
    }
}
