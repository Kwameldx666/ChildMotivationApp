using FluentValidation;

namespace UserService.Application.Features.Profile.UpdateUserProfile;

public class UpdateUserProfileCommandValidator : AbstractValidator<UpdateUserProfileCommand>
{
    public UpdateUserProfileCommandValidator()
    {
        RuleFor(command => command.UserId)
            .NotEmpty();

        RuleFor(command => command.Name)
            .MaximumLength(128)
            .When(command => command.Name is not null);

        RuleFor(command => command.LastName)
            .MaximumLength(128)
            .When(command => command.LastName is not null);

        RuleFor(command => command.Age)
            .InclusiveBetween(0, 120)
            .When(command => command.Age.HasValue);

        RuleFor(command => command)
            .Must(command => command.Name is not null
                              || command.LastName is not null
                              || command.Avatar is not null
                              || command.Age.HasValue)
            .WithMessage("At least one field must be provided for update.");
    }
}
