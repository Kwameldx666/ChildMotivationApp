using System.Diagnostics.CodeAnalysis;
namespace AuthService.Application.Dto.User;

[ExcludeFromCodeCoverage]

public record AuthorizationUrlResponse(string AuthorizationUrl, string State);

