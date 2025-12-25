using AuthService.Domain.Entities;
using AuthService.Domain.Enums;
using UserService.Application.Dto.User;

namespace UserService.Application.Features.Profile;

public static class UserProfileMapper
{
    public static UserProfileResponse Map(User user)
    {
        var userDto = new UserDto(
            user.Id.ToString(),
            user.Email!,
            user.Name ?? string.Empty,
            user.LastName ?? string.Empty);

        var profile = new UserProfileDto(
            user.Name ?? string.Empty,
            user.LastName ?? string.Empty,
            user.Avatar ?? string.Empty,
            user.UserType.ToString().ToLowerInvariant(),
            user.UserType == UserType.Child ? user.Age : null);

        var family = string.IsNullOrWhiteSpace(user.FamilyCode)
            ? null
            : new FamilyDto(user.FamilyCode, user.FamilyName, user.FamilyEmblem);

        return new UserProfileResponse(userDto, profile, family);
    }
}
