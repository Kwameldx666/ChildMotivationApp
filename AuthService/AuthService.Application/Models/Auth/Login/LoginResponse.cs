using System.Diagnostics.CodeAnalysis;
namespace AuthService.Application.Models.Auth.Login;

[ExcludeFromCodeCoverage]

public class LoginResponse(
    string accessToken,
    string refreshToken,
    string tokenType = "Bearer")
{
    public string AccessToken { get; init; } = accessToken;
    public string RefreshToken { get; init; } = refreshToken;
    public string TokenType { get; init; } = tokenType;
}

