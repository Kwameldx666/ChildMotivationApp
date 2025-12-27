using System.Net;
using AuthService.Application.Abstractions;
using AuthService.Application.Abstractions.Authentication;
using AuthService.Application.Dto.User;
using AuthService.Application.Features.Authentication.SignIn.Shared.Dto;
using AuthService.Common.Constants.Errors;
using AuthService.Common.ResultPattern;
using MediatR;

namespace AuthService.Application.Features.Authentication.SignIn.Google.GetPendingUser;

public class GetGooglePendingUserQueryHandler(IOAuthPendingUserStore pendingUserStore)
    : IRequestHandler<GetGooglePendingUserQuery, Result<ExternalPendingUserResponse>>
{
    public async Task<Result<ExternalPendingUserResponse>> Handle(GetGooglePendingUserQuery request,
        CancellationToken cancellationToken)
    {
        var pendingUser = await pendingUserStore.GetAsync<GooglePendingUser>(request.Token, cancellationToken);
        if (pendingUser is null)
            return Result<ExternalPendingUserResponse>.Failure(HttpStatusCode.BadRequest,
                DefaultErrors.BadRequest("Pending registration token is invalid or has expired."));

        var response = new ExternalPendingUserResponse(pendingUser.Email, pendingUser.Name, pendingUser.Picture);
        return Result<ExternalPendingUserResponse>.Success(response);
    }
}