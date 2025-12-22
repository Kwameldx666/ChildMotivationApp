namespace AuthService.Application.Abstractions.Infrastructure;

public interface IUserManagement
{
    Task<bool> LogoutUserAsync();
}