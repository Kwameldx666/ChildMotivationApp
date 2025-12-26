namespace Gateway.Common.HttpUrls;

public class AuthEndpoints
{
    public string Register { get; set; } = string.Empty;
    public string Login { get; set; } = string.Empty;
    public string Refresh { get; set; } = string.Empty;
    
    public string GoogleAuthorize { get; set; } = string.Empty;
    public string GoogleSession { get; set; } = string.Empty;
    public string GooglePending { get; set; } = string.Empty;
    public string GoogleComplete { get; set; } = string.Empty;
    
    public string GitHubAuthorize { get; set; } = string.Empty;
    public string GitHubSession { get; set; } = string.Empty;
    public string GitHubPending { get; set; } = string.Empty;
    public string GitHubComplete { get; set; } = string.Empty;
    
}