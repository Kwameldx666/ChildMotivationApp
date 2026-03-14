using System.Diagnostics.CodeAnalysis;
namespace AuthService.Application.Models.Auth.Login;

[ExcludeFromCodeCoverage]

public class GenerateTokenResponse
{
    public required string AccessToken { get; set; }
    public required string RefreshToken { get; set; }
}

