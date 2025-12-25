namespace UserService.Application.Dto.User;

public record UserDto(
    string Id,
    string Email,
    string Name,
    string LastName);
