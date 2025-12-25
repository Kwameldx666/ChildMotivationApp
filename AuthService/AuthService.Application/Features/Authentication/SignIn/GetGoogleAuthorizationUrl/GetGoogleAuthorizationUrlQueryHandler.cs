using AuthService.Application.Abstractions.Infrastructure;
using AuthService.Application.Dto.Auth.SignIn;
using AuthService.Common.Constants.HttpUrls;
using AuthService.Common.ExternalOptions.SignIn;
using AuthService.Common.ResultPattern;
using MediatR;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Options;

namespace AuthService.Application.Features.Authentication.SignIn.GetGoogleAuthorizationUrl;

public class GetGoogleAuthorizationUrlQueryHandler(
    IGoogleStateStore stateStore,
    IOptions<GoogleOptions> googleOptions,
    IOptions<GoogleEndpoints> googleEndpoints)
    : IRequestHandler<GetGoogleAuthorizationUrlQuery, Result<GoogleAuthorizationResponse>>
{
    private static readonly string[] Scopes =
    {
        "openid",
        "email",
        "profile"
    };

    public async Task<Result<GoogleAuthorizationResponse>> Handle(GetGoogleAuthorizationUrlQuery request,
        CancellationToken cancellationToken)
    {
        var options = googleOptions.Value;
        var endpoints = googleEndpoints.Value;

        var state = await stateStore.CreateStateAsync(cancellationToken);

        var query = new Dictionary<string, string?>
        {
            ["client_id"] = options.ClientId,
            ["redirect_uri"] = options.RedirectUri,
            ["response_type"] = "code",
            ["scope"] = string.Join(' ', Scopes),
            ["access_type"] = "offline",
            ["prompt"] = "consent",
            ["state"] = state
        };

        var authorizationUrl = QueryHelpers.AddQueryString(endpoints.GoogleAuthorize, query);

        var response = new GoogleAuthorizationResponse(authorizationUrl, state);
        return Result<GoogleAuthorizationResponse>.Success(response);
    }
}