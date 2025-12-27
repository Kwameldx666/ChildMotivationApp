using System.Net;
using AuthService.Application.Abstractions.Authentication.External;
using AuthService.Application.Features.Authentication.External.Shared.Dto;
using AuthService.Common.Constants.Errors;
using AuthService.Common.ResultPattern;
using MediatR;

namespace AuthService.Application.Features.Authentication.External.Google.GetSession;

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