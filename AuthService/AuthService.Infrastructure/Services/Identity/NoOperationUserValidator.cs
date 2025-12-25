using Microsoft.AspNetCore.Identity;

namespace AuthService.Infrastructure.Services.Identity;

public class NoOperationUserValidator<TUser> : IUserValidator<TUser> where TUser : class
{
    public Task<IdentityResult> ValidateAsync(UserManager<TUser> manager, TUser user)
    {
        return Task.FromResult(IdentityResult.Success);
    }
}