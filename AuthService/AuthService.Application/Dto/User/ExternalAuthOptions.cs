namespace AuthService.Application.Dto.User;

public class ExternalAuthOptions
{
    public string ClientId { get; set; }
    public string ClientSecret { get; set; }
    public string RedirectUri { get; set; }
    public string PostSignInRedirectUri { get; set; }
}