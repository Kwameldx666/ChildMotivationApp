using System.Diagnostics.CodeAnalysis;
namespace UserService.Application.Dto.User;

[ExcludeFromCodeCoverage]

public record UserProfileDto(
    string Name,
    string LastName,
    string Avatar,
    string Role,
    int? Age);


