using AuthService.Application.Abstractions.Authentication.External;
using AuthService.Application.Dto.User;
using AuthService.Application.Enums;
using AuthService.Common.ResultPattern;
using AuthService.Domain.Enums;
using MediatR;

namespace AuthService.Application.Features.Authentication.External.GitHub.GetAuthorizationUrl;

public class GetGitHubAuthorizationUrlQueryHandler(
    IOAuthStateStore stateStore,
    IExternalAuthProviderFactory providerFactory)
    : IRequestHandler<GetGitHubAuthorizationUrlQuery, Result<AuthorizationUrlResponse>>
{
    public async Task<Result<AuthorizationUrlResponse>> Handle(GetGitHubAuthorizationUrlQuery request,
        CancellationToken cancellationToken)
    {
        var state = await stateStore.CreateStateAsync(ExternalProviderType.GitHub, cancellationToken);

        var provider = providerFactory.GetProvider(ExternalProviderType.GitHub);

        var authResponse = provider.BuildAuthQuery(state, ExternalScopes.GitHub.All.ToArray());

        return Result<AuthorizationUrlResponse>.Success(authResponse);
    }
}