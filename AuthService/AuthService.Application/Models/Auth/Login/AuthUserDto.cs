namespace AuthService.Application.Models.Auth.Login;

public record AuthUserDto(
    string Id,
    string Email,
    string Name,
    string LastName);