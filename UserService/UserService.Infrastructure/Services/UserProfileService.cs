using System;
using System.Collections.Generic;
using System.Linq;
using AuthService.Domain.Entities;
using AuthService.Domain.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
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

    public async Task<IReadOnlyCollection<FamilyMemberDto>> GetFamilyMembersAsync(Guid userId, CancellationToken cancellationToken)
    {
        var familyCode = await userManager.Users
            .AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => u.FamilyCode)
            .FirstOrDefaultAsync(cancellationToken);

        if (string.IsNullOrWhiteSpace(familyCode))
        {
            return Array.Empty<FamilyMemberDto>();
        }

        var members = await userManager.Users
            .AsNoTracking()
            .Where(u => u.FamilyCode == familyCode)
            .OrderBy(u => u.UserType)
            .ThenBy(u => u.Name)
            .Select(u => new FamilyMemberDto(
                u.Id,
                u.UserType.ToString().ToLowerInvariant(),
                u.Name ?? string.Empty,
                u.LastName,
                u.Avatar,
                u.UserType == UserType.Child ? u.Age : null))
            .ToListAsync(cancellationToken);

        return members;
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
