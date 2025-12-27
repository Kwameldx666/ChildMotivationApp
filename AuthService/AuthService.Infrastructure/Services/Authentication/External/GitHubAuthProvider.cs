using AuthService.Application.Abstractions.Authentication.External;
using AuthService.Application.Dto.User;
using AuthService.Application.Features.Authentication.External.Shared.Dto;
using AuthService.Infrastructure.Options.External;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Options;

namespace AuthService.Infrastructure.Services.Authentication.External;

public class GitHubAuthProvider(IOptions<GitHubOptions> gitHubOptions, IOptions<GitHubEndpoints> gitHubEndpoints)
    : IExternalAuthProvider
{
    public Task<HttpResponseMessage> RequestAccessToken(string code, CancellationToken cancellationToken)
    {
        throw new NotImplementedException();
    }

    public Task<HttpResponseMessage> RequestUserInfo(string accessToken, CancellationToken cancellationToken)
    {
        throw new NotImplementedException();
    }

    public AuthorizationResponse BuildAuthQuery(string state, string[] scopes)
    {
        var query = new Dictionary<string, string?>
        {
            ["client_id"] = gitHubOptions.Value.ClientId,
            ["redirect_uri"] = gitHubOptions.Value.RedirectUri,
            ["response_type"] = "code",
            ["scope"] = string.Join(' ', scopes),
            ["access_type"] = "offline",
            ["prompt"] = "consent",
            ["state"] = state
        };

        var authorizationUrl = QueryHelpers.AddQueryString(gitHubEndpoints.Value.GitHubAuthorize, query);

        var response = new AuthorizationResponse(authorizationUrl, state);
        return response;
    }
}