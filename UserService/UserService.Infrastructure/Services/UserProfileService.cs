using AuthService.Domain.Entities;
using AuthService.Domain.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using UserService.Application.Interfaces;
using UserService.Application.Dto.User;
using UserService.Application.Features.Profile;

namespace UserService.Infrastructure.Services;

public class UserProfileService(UserManager<User> userManager) : IUserProfileProvider
{
    public async Task<UserProfileResponse?> GetProfileAsync(Guid userId, CancellationToken cancellationToken)
    {
        var user = await userManager.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        return user is null ? null : UserProfileMapper.Map(user);
    }

    public async Task<UserProfileResponse?> UpdateProfileAsync(Guid userId, UpdateUserProfileRequest request, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(userId.ToString());
        if (user is null)
        {
            return null;
        }

        user.Name = Normalize(request.Name);
        user.LastName = Normalize(request.LastName);

        if (request.Avatar is not null)
        {
            user.Avatar = Normalize(request.Avatar);
        }

        if (user.UserType == UserType.Child)
        {
            user.Age = request.Age;
        }
        else
        {
            user.Age = null;
        }

        var updateResult = await userManager.UpdateAsync(user);
        if (!updateResult.Succeeded)
        {
            var errorDescription = string.Join("; ", updateResult.Errors.Select(error => error.Description));
            throw new InvalidOperationException(string.IsNullOrWhiteSpace(errorDescription)
                ? "Unable to update user profile."
                : errorDescription);
        }

        return UserProfileMapper.Map(user);
    }

    private static string? Normalize(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return value.Trim();
    }
}
