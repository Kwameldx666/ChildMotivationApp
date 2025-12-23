namespace UserService.Application.Dto.User;

public record UpdateUserProfileRequest(
    string? Name,
    string? LastName,
    string? Avatar,
    int? Age);
