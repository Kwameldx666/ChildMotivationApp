using UserService.Application.Abstractions;
using UserService.Application.Dto.User;
using MediatR;

namespace UserService.Application.Features.Profile.GetUserProfile;

public class GetUserProfileQueryHandler(IUserProfileProvider userProfileProvider)
    : IRequestHandler<GetUserProfileQuery, UserProfileResponse?>
{
    public Task<UserProfileResponse?> Handle(GetUserProfileQuery request, CancellationToken cancellationToken)
    {
        return userProfileProvider.GetProfileAsync(request.UserId, cancellationToken);
    }
}
