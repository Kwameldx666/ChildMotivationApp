using AuthService.Application.Abstractions.Infrastructure;
using Microsoft.AspNetCore.Identity;

namespace AuthService.Infrastructure.Services.User;

public class UserManagementService(SignInManager<Domain.Entities.User> signInManager) : IUserManagement
{
    public async Task<bool> LogoutUserAsync()
    {
        await signInManager.SignOutAsync();
        return true;
    }
}