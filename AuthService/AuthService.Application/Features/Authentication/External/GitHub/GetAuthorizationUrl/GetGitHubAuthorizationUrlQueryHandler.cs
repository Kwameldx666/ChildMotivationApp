using AuthService.Application.Abstractions.Authentication.External;
using AuthService.Application.Dto.User;
using AuthService.Application.Features.Authentication.External.Shared.Dto;
using AuthService.Common.ResultPattern;
using AuthService.Domain.Enums;
using MediatR;

namespace AuthService.Application.Features.Authentication.External.GitHub.GetAuthorizationUrl;

public class GetGitHubAuthorizationUrlQueryHandler(IOAuthStateStore stateStore, IExternalAuthProvider authProvider)
    : IRequestHandler<GetGitHubAuthorizationUrlQuery, Result<AuthorizationResponse>>
{
    public async Task<Result<AuthorizationResponse>> Handle(GetGitHubAuthorizationUrlQuery request,
        CancellationToken cancellationToken)
    {
        var state = await stateStore.CreateStateAsync(cancellationToken);

        var authResponse = authProvider.BuildAuthQuery(state, ExternalScopes.GitHub.ToArray());

        return Result<AuthorizationResponse>.Success(authResponse);
    }
}