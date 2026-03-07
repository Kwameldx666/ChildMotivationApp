using FluentValidation;

namespace UserService.Application.Features.Profile.GetFamilyMembers;

public class GetFamilyMembersQueryValidator : AbstractValidator<GetFamilyMembersQuery>
{
    public GetFamilyMembersQueryValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("Идентификатор пользователя обязателен.");
    }
}
