using FluentValidation;

namespace UserService.Application.Features.Profile.UpdateUserProfile;

public class UpdateUserProfileCommandValidator : AbstractValidator<UpdateUserProfileCommand>
{
    public UpdateUserProfileCommandValidator()
    {
        RuleFor(command => command.UserId)
            .NotEmpty();

        RuleFor(command => command.Name)
            .MinimumLength(2).WithMessage("Имя должно содержать минимум 2 символа.")
            .MaximumLength(128)
            .Matches(@"^[\p{L}\s\-]+$").WithMessage("Имя может содержать только буквы, пробелы и дефисы.")
            .When(command => command.Name is not null);

        RuleFor(command => command.LastName)
            .MinimumLength(2).WithMessage("Фамилия должна содержать минимум 2 символа.")
            .MaximumLength(128)
            .Matches(@"^[\p{L}\s\-]+$").WithMessage("Фамилия может содержать только буквы, пробелы и дефисы.")
            .When(command => command.LastName is not null);

        RuleFor(command => command.Avatar)
            .MaximumLength(512)
            .When(command => command.Avatar is not null);

        RuleFor(command => command.Age)
            .InclusiveBetween(1, 120).WithMessage("Возраст должен быть от 1 до 120.")
            .When(command => command.Age.HasValue);

        RuleFor(command => command)
            .Must(command => command.Name is not null
                              || command.LastName is not null
                              || command.Avatar is not null
                              || command.Age.HasValue)
            .WithMessage("Необходимо указать хотя бы одно поле для обновления.");
    }
}
