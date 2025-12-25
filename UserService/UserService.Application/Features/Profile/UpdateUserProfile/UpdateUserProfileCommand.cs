using UserService.Application.Dto.User;
using MediatR;

namespace UserService.Application.Features.Profile.UpdateUserProfile;

public record UpdateUserProfileCommand(
    Guid UserId,
    string? Name,
    string? LastName,
    string? Avatar,
    int? Age) : IRequest<UserProfileResponse?>;
