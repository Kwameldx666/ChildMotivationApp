using System.Diagnostics.CodeAnalysis;
namespace UserService.Application.Dto.User;

[ExcludeFromCodeCoverage]

public record FamilyDto(
    string? Code,
    string? Name,
    string? Emblem);


