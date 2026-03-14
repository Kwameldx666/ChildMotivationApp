using System.Diagnostics.CodeAnalysis;
namespace UserService.Application.Dto.User;

[ExcludeFromCodeCoverage]

public record UserDto(
    string Id,
    string Email,
    string Name,
    string LastName);


