using UserService.Application.Dto.User;

namespace UserService.Application.Abstractions;

public interface IUserProfileProvider
{
    Task<UserProfileResponse?> GetProfileAsync(Guid userId, CancellationToken cancellationToken);
    Task<UserProfileResponse?> UpdateProfileAsync(Guid userId, UpdateUserProfileRequest request, CancellationToken cancellationToken);
}
