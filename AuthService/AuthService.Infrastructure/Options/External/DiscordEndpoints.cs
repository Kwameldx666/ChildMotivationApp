namespace AuthService.Infrastructure.Options.External;

public class DiscordEndpoints
{
    public string DiscordToken { get; set; } = "https://discord.com/api/oauth2/token";
    public string DiscordUserInfo { get; set; } = "https://discord.com/api/users/@me";
    public string DiscordAuthorize { get; set; } = "https://discord.com/oauth2/authorize";
}