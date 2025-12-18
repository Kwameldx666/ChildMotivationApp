namespace AuthService.Application.Dto.Auth;

public record RegisterProfile(
    string Name,
    string LastName,
    string Avatar,
    string? Role,
    int? Age
);