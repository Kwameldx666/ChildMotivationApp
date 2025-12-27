using AuthService.Application.Abstractions;
using AuthService.Application.Abstractions.Authentication;
using AuthService.Application.Features.Authentication.SignIn.Shared.Dto;
using AuthService.Common.Constants.HttpUrls;
using AuthService.Common.ExternalOptions.SignIn;
using AuthService.Common.ResultPattern;
using AuthService.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Options;

namespace AuthService.Application.Features.Authentication.SignIn.Google.GetAuthorizationUrl;

public class GetGoogleAuthorizationUrlQueryHandler(
    IOAuthStateStore stateStore,
    IOptions<GoogleOptions> googleOptions,
    IOptions<GoogleEndpoints> googleEndpoints)
    : IRequestHandler<GetGoogleAuthorizationUrlQuery, Result<AuthorizationResponse>>
{
    public async Task<Result<AuthorizationResponse>> Handle(GetGoogleAuthorizationUrlQuery request,
        CancellationToken cancellationToken)
    {
        var options = googleOptions.Value;
        var endpoints = googleEndpoints.Value;

        var state = await stateStore.CreateStateAsync(cancellationToken);

        var query = BuildGoogleAuthQuery(options, state, ExternalScopes.All.ToArray());

        var authorizationUrl = QueryHelpers.AddQueryString(endpoints.GoogleAuthorize, query);

        var response = new AuthorizationResponse(authorizationUrl, state);
        return Result<AuthorizationResponse>.Success(response);
    }

    private static Dictionary<string, string?> BuildGoogleAuthQuery(
        GoogleOptions options,
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