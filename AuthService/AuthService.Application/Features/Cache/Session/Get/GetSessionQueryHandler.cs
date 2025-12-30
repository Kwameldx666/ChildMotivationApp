using System.Net;
using AuthService.Application.Abstractions.Authentication.External;
using AuthService.Application.Dto.User;
using AuthService.Common.Constants.Errors;
using AuthService.Common.ResultPattern;
using MediatR;

namespace AuthService.Application.Features.Cache.Session.Get;

public class GetSessionQueryHandler(IOAuthSessionStore sessionStore)
    : IRequestHandler<GetSessionQuery, Result<ExternalLoginResponse>>
{
    public async Task<Result<ExternalLoginResponse>> Handle(GetSessionQuery request,
        CancellationToken cancellationToken)
    {
        var session = await sessionStore.TakeAsync(request.Token, cancellationToken);
        if (session is null)
            return Result<ExternalLoginResponse>.Failure(HttpStatusCode.BadRequest,
                DefaultErrors.BadRequest("Session token is invalid or has expired."));

        return Result<ExternalLoginResponse>.Success(session);
    }
}