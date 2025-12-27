using AuthService.Application.Dto.User;

namespace AuthService.Infrastructure.Services.OAuth.Google;

public class GooglePendingUserResponse(string email, string name, string picture) 
{
    public string Email { get; } = email;
    public string Name { get; } = name;
    public string Picture { get; } = picture;
}