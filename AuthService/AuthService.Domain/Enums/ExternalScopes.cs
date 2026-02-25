namespace AuthService.Domain.Enums;

public static class ExternalScopes
{
    public static class Google
    {
        public const string Email = "email";
        public const string Profile = "profile";
        public const string OpenId = "openid";

        public static readonly IReadOnlyCollection<string> All = [Email, Profile, OpenId];
    }

    public static class GitHub
    {
        public const string UserEmail = "user:email";
        public const string ReadUser = "read:user";

        public static readonly IReadOnlyCollection<string> All = [UserEmail, ReadUser];
    }

    public static class Discord
    {
        public const string Identify = "identify";
        public const string Email = "email";

        public static readonly IReadOnlyCollection<string> All = [Identify, Email];
    }
}