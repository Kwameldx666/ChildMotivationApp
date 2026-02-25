using AuthService.Application.Enums;

namespace AuthService.Application.Dto.User;

public class ExternalSignInResult(ExternalSignInStatus status, string token)
{
    public ExternalSignInStatus Status { get; } = status;
    public string Token { get; } = token;
}