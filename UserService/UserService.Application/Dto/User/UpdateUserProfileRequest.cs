using System.Diagnostics.CodeAnalysis;
namespace UserService.Application.Dto.User;

[ExcludeFromCodeCoverage]

public record UpdateUserProfileRequest(
    string? Name,
    string? LastName,
    string? Avatar,
    int? Age);


