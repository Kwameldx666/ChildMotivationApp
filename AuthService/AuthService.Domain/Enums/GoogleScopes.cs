namespace AuthService.Domain.Enums;

public static class GoogleScopes
{
    public const string Email = "email";
    public const string Profile = "profile";
    public const string OpenId = "openid";
    
    public static IReadOnlyCollection<string> All = [Email, Profile, OpenId]; 
}