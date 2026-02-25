namespace AuthService.Infrastructure.Options.External;

public class GitHubEndpoints
{
    public string GitHubToken { get; set; } = null!;
    public string GitHubUserInfo { get; set; } = null!;
    public string GitHubEmails { get; set; } = null!;
    public string GitHubAuthorize { get; set; } = null!;
}