using AuthService.Application.Abstractions.Authentication.External;
using AuthService.Application.Dto.User;
using AuthService.Application.Features.Authentication.External.Shared.Dto;
using AuthService.Common.ResultPattern;
using AuthService.Domain.Enums;
using MediatR;

namespace AuthService.Application.Features.Authentication.External.Google.GetAuthorizationUrl;

public class GetGoogleAuthorizationUrlQueryHandler(
    IOAuthStateStore stateStore,
    IExternalAuthProvider authProvider)
    : IRequestHandler<GetGoogleAuthorizationUrlQuery, Result<AuthorizationResponse>>
{
    public async Task<Result<AuthorizationResponse>> Handle(GetGoogleAuthorizationUrlQuery request,
        CancellationToken cancellationToken)
    {
        var state = await stateStore.CreateStateAsync(cancellationToken);

        var authorizationResponse = authProvider.BuildAuthQuery(state, ExternalScopes.All.ToArray());

        return Result<AuthorizationResponse>.Success(authorizationResponse);
    }
}