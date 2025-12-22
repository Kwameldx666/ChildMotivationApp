namespace AuthService.Application.Dto;

public record UserProfileDto(
    string Name,
    string LastName,
    string Avatar,
    string Role,
    int? Age);
