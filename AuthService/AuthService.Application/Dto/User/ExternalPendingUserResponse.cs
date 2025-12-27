namespace AuthService.Application.Features.Authentication.External.Shared.Dto;

public class ExternalPendingUserResponse(string email, string name, string picture)
{
    public string Email { get; } = email;
    public string Name { get; } = name;
    public string Picture { get; } = picture;
}