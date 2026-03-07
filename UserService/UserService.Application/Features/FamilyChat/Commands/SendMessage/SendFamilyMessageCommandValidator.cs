using FluentValidation;

namespace UserService.Application.Features.FamilyChat.Commands.SendMessage;

public class SendFamilyMessageCommandValidator : AbstractValidator<SendFamilyMessageCommand>
{
    public SendFamilyMessageCommandValidator()
    {
        RuleFor(x => x.FamilyId)
            .NotEmpty().WithMessage("Идентификатор семьи обязателен.")
            .MaximumLength(64);

        RuleFor(x => x.SenderId)
            .NotEmpty().WithMessage("Идентификатор отправителя обязателен.")
            .MaximumLength(64);

        RuleFor(x => x.Content)
            .NotEmpty().WithMessage("Сообщение не может быть пустым.")
            .MaximumLength(2000).WithMessage("Сообщение не может превышать 2000 символов.");
    }
}
