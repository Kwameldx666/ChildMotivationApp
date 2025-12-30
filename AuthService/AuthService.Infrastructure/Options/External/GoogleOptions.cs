using Microsoft.AspNetCore.Authentication.OAuth;

namespace AuthService.Infrastructure.Options.External;

public class GoogleOptions : OAuthOptions
{
    public string ClientId { get; set; } = null!;
    public string ClientSecret { get; set; } = null!;
    public string RedirectUri { get; set; } = null!;
    public string PostSignInRedirectUri { get; set; } = null!;
}