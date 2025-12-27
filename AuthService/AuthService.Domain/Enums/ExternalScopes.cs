namespace AuthService.Domain.Enums;

public static class ExternalScopes
{
    public const string Email = "email";
    public const string Profile = "profile";
    public const string OpenId = "openid";

    public static IReadOnlyCollection<string> Google = [Email, Profile, OpenId];
    // GitHub uses different scope names; request email and read:user to obtain profile/email
    public static IReadOnlyCollection<string> GitHub = ["user:email", "read:user"];
    public static IReadOnlyCollection<string> All = [Email, Profile, OpenId];
}