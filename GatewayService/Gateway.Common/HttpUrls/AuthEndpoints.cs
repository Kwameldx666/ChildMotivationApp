namespace Gateway.Common.HttpUrls;

public class AuthEndpoints
{
    public string Register { get; set; } = string.Empty;
    public string Login { get; set; } = string.Empty;
    public string Refresh { get; set; } = string.Empty;

    public string Session { get; set; } = string.Empty;
    public string Pending { get; set; } = string.Empty;

    public string GoogleAuthorize { get; set; } = string.Empty;
    public string GoogleComplete { get; set; } = string.Empty;

    public string GitHubAuthorize { get; set; } = string.Empty;
    public string GitHubComplete { get; set; } = string.Empty;

    public string DiscordAuthorize { get; set; } = string.Empty;
    public string DiscordComplete { get; set; } = string.Empty;

    public string DeleteAccount { get; set; } = "auth-service/account";
    public string ChangePassword { get; set; } = "auth-service/change-password";
    public string ChangeEmail { get; set; } = "auth-service/change-email";
    public string ConfirmEmail { get; set; } = "auth-service/confirm-email";
    public string ResendConfirmation { get; set; } = "auth-service/resend-confirmation";
}