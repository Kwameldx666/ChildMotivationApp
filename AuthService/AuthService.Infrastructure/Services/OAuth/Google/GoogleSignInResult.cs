using AuthService.Application.Enums;

namespace AuthService.Infrastructure.Services.OAuth.Google;

public class GoogleSignInResult(ExternalSignInStatus status, string token)
{
    public ExternalSignInStatus Status { get; } = status;
    public string Token { get; } = token;
}