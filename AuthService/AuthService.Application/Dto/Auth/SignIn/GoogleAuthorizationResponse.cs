namespace AuthService.Application.Dto.Auth.SignIn;

public class GoogleAuthorizationResponse(string authorizationUrl, string state)
{
    public string AuthorizationUrl { get; } = authorizationUrl;
    public string State { get; } = state;
}