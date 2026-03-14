using System.Diagnostics.CodeAnalysis;
namespace AuthService.Application.Models.User;

[ExcludeFromCodeCoverage]

public record UserProfileDto(
    string Name,
    string LastName,
    string Avatar,
    string Role,
    int? Age);

