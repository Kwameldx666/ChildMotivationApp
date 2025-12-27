namespace AuthService.Application.Abstractions.Authentication;

public interface IExternalPendingUserResponse
{
    public string Email { get; }
    public string Name { get; } 
    public string Picture { get; } 
}