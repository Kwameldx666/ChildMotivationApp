namespace AuthService.Application.Dto.Auth.SignIn;

public class GoogleSignInResult(GoogleSignInStatus status, string token)
{
    public GoogleSignInStatus Status { get; } = status;
    public string Token { get; } = token;
}