namespace AuthService.Application.Abstractions.Authentication;

public interface IExternalAuthOptions
{
    public string ClientId { get; set; } 
    public string ClientSecret { get; set; } 
    public string RedirectUri { get; set; } 
    public string PostSignInRedirectUri { get; set; } 
}