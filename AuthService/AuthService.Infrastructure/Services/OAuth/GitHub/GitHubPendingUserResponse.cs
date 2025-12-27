namespace AuthService.Infrastructure.Services.OAuth.GitHub;

public class GitHubPendingUserResponse(string email, string name, string avatar)
{
    public string Email { get; } = email;
    public string Name { get; } = name;
    public string Avatar { get; } = avatar;
}