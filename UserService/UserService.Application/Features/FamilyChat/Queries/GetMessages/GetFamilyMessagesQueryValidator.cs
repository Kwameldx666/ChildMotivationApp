using FluentValidation;

namespace UserService.Application.Features.FamilyChat.Queries.GetMessages;

public class GetFamilyMessagesQueryValidator : AbstractValidator<GetFamilyMessagesQuery>
{
    public GetFamilyMessagesQueryValidator()
    {
        RuleFor(x => x.FamilyId)
            .NotEmpty().WithMessage("Идентификатор семьи обязателен.")
            .MaximumLength(64);

        RuleFor(x => x.Limit)
            .InclusiveBetween(1, 200).WithMessage("Лимит должен быть от 1 до 200.");
    }
}
