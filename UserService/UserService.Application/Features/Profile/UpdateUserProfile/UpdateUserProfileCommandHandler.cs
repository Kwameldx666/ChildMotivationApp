using UserService.Application.Interfaces;
using UserService.Application.Dto.User;
using MediatR;

namespace UserService.Application.Features.Profile.UpdateUserProfile;

public class UpdateUserProfileCommandHandler(IUserProfileProvider userProfileProvider)
    : IRequestHandler<UpdateUserProfileCommand, UserProfileResponse?>
{
    public Task<UserProfileResponse?> Handle(UpdateUserProfileCommand request, CancellationToken cancellationToken)
    {
        var payload = new UpdateUserProfileRequest(request.Name, request.LastName, request.Avatar, request.Age);
        return userProfileProvider.UpdateProfileAsync(request.UserId, payload, cancellationToken);
    }
}
