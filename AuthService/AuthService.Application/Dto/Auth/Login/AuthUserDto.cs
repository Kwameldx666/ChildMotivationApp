namespace AuthService.Application.Dto.Auth.Login;

public record AuthUserDto(
    string Id,
    string Email,
    string Name,
    string LastName);