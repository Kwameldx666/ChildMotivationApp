using System.Diagnostics.CodeAnalysis;
namespace AuthService.Application.Models.User;

[ExcludeFromCodeCoverage]

public record FamilyDto(
    string? Code,
    string? Name,
    string? Emblem);

