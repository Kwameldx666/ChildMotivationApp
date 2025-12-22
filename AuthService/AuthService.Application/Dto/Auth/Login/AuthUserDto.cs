namespace AuthService.Application.Dto;

public record AuthUserDto(
    string Id,
    string Email,
    string Name,
    string LastName);