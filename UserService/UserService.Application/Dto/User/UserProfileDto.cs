namespace UserService.Application.Dto.User;

public record UserProfileDto(
    string Name,
    string LastName,
    string Avatar,
    string Role,
    int? Age);
