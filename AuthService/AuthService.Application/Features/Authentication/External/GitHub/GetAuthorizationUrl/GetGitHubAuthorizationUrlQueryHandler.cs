using AuthService.Application.Abstractions;
using AuthService.Application.Abstractions.Authentication;
using AuthService.Application.Features.Authentication.SignIn.Shared.Dto;
using AuthService.Common.ExternalOptions.SignIn;
using AuthService.Common.ResultPattern;
using AuthService.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Options;

namespace AuthService.Application.Features.Authentication.SignIn.GitHub.GetAuthorizationUrl;

public class GetGitHubAuthorizationUrlQueryHandler(IOAuthStateStore stateStore, IOptions<GitHubOptions> options)
    : IRequestHandler<GetGitHubAuthorizationUrlQuery, Result<AuthorizationResponse>>
{
    public async Task<Result<AuthorizationResponse>> Handle(GetGitHubAuthorizationUrlQuery request,
        CancellationToken cancellationToken)
    {
        var state = await stateStore.CreateStateAsync(cancellationToken);

        var query = BuildGitHubAuthQuery(options.Value, state, ExternalScopes.GitHub.ToArray());

        var authorizationUrl = QueryHelpers.AddQueryString("https://github.com/login/oauth/authorize", query);

        var response = new AuthorizationResponse(authorizationUrl, state);
        return Result<AuthorizationResponse>.Success(response);
    }

    private static Dictionary<string, string?> BuildGitHubAuthQuery(
        GitHubOptions options,
        string state,
        string[] scopes)
    {
        return new Dictionary<string, string?>
        {
            ["client_id"] = options.ClientId,
            ["redirect_uri"] = options.RedirectUri,
            ["response_type"] = "code",
            ["scope"] = string.Join(' ', scopes),
            ["access_type"] = "offline",
            ["prompt"] = "consent",
            ["state"] = state
        };
    }
}