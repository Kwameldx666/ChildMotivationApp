using System.Net;
using AuthService.Application.Abstractions.Infrastructure;
using AuthService.Application.Dto.Auth.Login;
using AuthService.Common.Constants.Errors;
using AuthService.Common.ResultPattern;
using MediatR;

namespace AuthService.Application.Features.Authentication.SignIn.Google.GetGoogleSession;

public class GetGoogleSessionQueryHandler(IOAuthSessionStore sessionStore)
    : IRequestHandler<GetGoogleSessionQuery, Result<ExternalLoginResponse>>
{
    public async Task<Result<ExternalLoginResponse>> Handle(GetGoogleSessionQuery request,
        CancellationToken cancellationToken)
    {
        var session = await sessionStore.TakeAsync(request.Token, cancellationToken);
        if (session is null)
            return Result<ExternalLoginResponse>.Failure(HttpStatusCode.BadRequest,
                DefaultErrors.BadRequest("Session token is invalid or has expired."));

        return Result<ExternalLoginResponse>.Success(session);
    }
}