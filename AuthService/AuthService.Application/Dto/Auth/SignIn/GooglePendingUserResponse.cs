namespace AuthService.Application.Dto.Auth.SignIn;

public class GooglePendingUserResponse(string email, string name, string picture)
{
    public string Email { get; } = email;
    public string Name { get; } = name;
    public string Picture { get; } = picture;
}