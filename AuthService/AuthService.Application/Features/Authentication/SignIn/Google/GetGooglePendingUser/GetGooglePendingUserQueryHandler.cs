using System.Net;
using AuthService.Application.Abstractions.Infrastructure;
using AuthService.Application.Dto.Auth.SignIn;
using AuthService.Common.Constants.Errors;
using AuthService.Common.ResultPattern;
using MediatR;

namespace AuthService.Application.Features.Authentication.SignIn.GetGooglePendingUser;

public class GetGooglePendingUserQueryHandler(IOAuthPendingUserStore pendingUserStore)
    : IRequestHandler<GetGooglePendingUserQuery, Result<GooglePendingUserResponse>>
{
    public async Task<Result<GooglePendingUserResponse>> Handle(GetGooglePendingUserQuery request,
        CancellationToken cancellationToken)
    {
        var pendingUser = await pendingUserStore.GetAsync(request.Token, cancellationToken);
        if (pendingUser is null)
            return Result<GooglePendingUserResponse>.Failure(HttpStatusCode.BadRequest,
                DefaultErrors.BadRequest("Pending registration token is invalid or has expired."));

        var response = new GooglePendingUserResponse(pendingUser.Email, pendingUser.Name, pendingUser.Picture);
        return Result<GooglePendingUserResponse>.Success(response);
    }
}