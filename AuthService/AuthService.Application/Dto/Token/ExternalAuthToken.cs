using System.Diagnostics.CodeAnalysis;
namespace AuthService.Application.Dto.Token;

[ExcludeFromCodeCoverage]

public sealed record ExternalAuthToken(
    string AccessToken,
    string? IdToken = null!
);

