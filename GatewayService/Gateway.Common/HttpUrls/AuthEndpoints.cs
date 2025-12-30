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
    
    public string MicrosoftAuthorize { get; set; } = string.Empty;
    public string MicrosoftComplete { get; set; } = string.Empty;

    // Discord endpoints (mapped from configuration)
    public string DiscordAuthorize { get; set; } = string.Empty;
    public string DiscordComplete { get; set; } = string.Empty;
}