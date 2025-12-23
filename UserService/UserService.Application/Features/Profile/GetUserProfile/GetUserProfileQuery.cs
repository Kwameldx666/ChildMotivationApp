using UserService.Application.Dto.User;
using MediatR;

namespace UserService.Application.Features.Profile.GetUserProfile;

public record GetUserProfileQuery(Guid UserId) : IRequest<UserProfileResponse?>;
