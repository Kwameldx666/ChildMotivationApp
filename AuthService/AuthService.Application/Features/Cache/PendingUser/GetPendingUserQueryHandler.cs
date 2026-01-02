using System.Net;
using AuthService.Application.Abstractions.Authentication.External;
using AuthService.Application.Dto.User;
using AuthService.Common.Constants.Errors;
using AuthService.Common.ResultPattern;
using MediatR;

namespace AuthService.Application.Features.Cache.PendingUser;

public class GetPendingUserQueryHandler(IOAuthPendingUserStore pendingUserStore)
    : IRequestHandler<GetPendingUserQuery, Result<ExternalPendingUserResponse>>
{
    public async Task<Result<ExternalPendingUserResponse>> Handle(GetPendingUserQuery request,
        CancellationToken cancellationToken)
    {
        var pendingUser = await pendingUserStore.GetAsync(request.Token, cancellationToken);
        if (pendingUser is null)
            return Result<ExternalPendingUserResponse>.Failure(HttpStatusCode.BadRequest,
                DefaultErrors.BadRequest("Pending registration token is invalid or has expired."));

        var response = new ExternalPendingUserResponse(
            pendingUser.Email,
            pendingUser.Name,
            pendingUser.Picture,
            pendingUser.ProviderUserId);
        return Result<ExternalPendingUserResponse>.Success(response);
    }
}