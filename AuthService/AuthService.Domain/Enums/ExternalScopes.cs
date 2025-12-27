namespace AuthService.Domain.Enums;

public static class ExternalScopes
{
    public const string Email = "email";
    public const string Profile = "profile";
    public const string OpenId = "openid";

    public static IReadOnlyCollection<string> Google = [Email, Profile, OpenId];
    public static IReadOnlyCollection<string> GitHub = [Email, Profile, OpenId];
    public static IReadOnlyCollection<string> All = [Email, Profile, OpenId];
}