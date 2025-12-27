namespace AuthService.Infrastructure.Services.OAuth.GitHub;

public class GitHubSignInResult(GitHubSignInStatus status, string token)
{
    public GitHubSignInStatus Status { get; } = status;
    public string Token { get; } = token;
}