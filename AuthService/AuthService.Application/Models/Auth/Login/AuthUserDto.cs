using System.Diagnostics.CodeAnalysis;
namespace AuthService.Application.Models.Auth.Login;

[ExcludeFromCodeCoverage]

public record AuthUserDto(
    string Id,
    string Email,
    string Name,
    string LastName);

