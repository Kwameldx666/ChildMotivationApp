namespace AuthService.Infrastructure.ExternalOptions.SignIn;

public class GoogleOptions
{
    public string ClientId { get; set; } = null!;
    public string ClientSecret { get; set; } = null!;
    public string RedirectUri { get; set; } = null!;
    public string PostSignInRedirectUri { get; set; } = null!;
}