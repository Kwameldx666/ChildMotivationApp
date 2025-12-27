using AuthService.Application.Dto.User;

namespace AuthService.Infrastructure.Options.External;

public class GitHubOptions
{
    public string ClientId { get; set; } = null!;
    public string ClientSecret { get; set; } = null!;
    public string RedirectUri { get; set; } = null!;
    public string PostSignInRedirectUri { get; set; } = null!;
}