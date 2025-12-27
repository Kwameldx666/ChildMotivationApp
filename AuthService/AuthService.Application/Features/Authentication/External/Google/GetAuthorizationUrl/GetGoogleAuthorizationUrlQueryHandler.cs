using AuthService.Application.Abstractions.Authentication.External;
using AuthService.Application.Features.Authentication.External.Shared.Dto;
using AuthService.Common.ResultPattern;
using AuthService.Domain.Enums;
using AuthService.Application.Enums;
using MediatR;
using Microsoft.Extensions.DependencyInjection;

namespace AuthService.Application.Features.Authentication.External.Google.GetAuthorizationUrl;

using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Logging;

public class GetGoogleAuthorizationUrlQueryHandler(
    IOAuthStateStore stateStore,
    IServiceProvider serviceProvider,
    ILogger<GetGoogleAuthorizationUrlQueryHandler> logger)
    : IRequestHandler<GetGoogleAuthorizationUrlQuery, Result<AuthorizationResponse>>
{
    public async Task<Result<AuthorizationResponse>> Handle(GetGoogleAuthorizationUrlQuery request,
        CancellationToken cancellationToken)
    {
        var state = await stateStore.CreateStateAsync(cancellationToken);

        var providerFactory = serviceProvider.GetService<AuthService.Application.Abstractions.Authentication.External.IExternalAuthProviderFactory>();
        var provider = providerFactory?.GetProvider(ExternalProviderType.Google)
                       ?? serviceProvider.GetRequiredService<AuthService.Application.Abstractions.Authentication.External.IExternalAuthProvider>();

        AuthorizationResponse authorizationResponse;

        try
        {
            authorizationResponse = provider.BuildAuthQuery(state, ExternalScopes.All.ToArray());
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to build Google authorization URL using provider {Provider}", provider.GetType().Name);
            return Result.Failure<AuthorizationResponse>(
                System.Net.HttpStatusCode.InternalServerError,
                AuthService.Common.Constants.Errors.DefaultErrors.InternalServerError("Failed to build authorization URL."));
        }

        if (authorizationResponse is null || string.IsNullOrWhiteSpace(authorizationResponse.AuthorizationUrl))
        {
            logger.LogError("Provider {Provider} returned an empty authorization URL.", provider.GetType().Name);
            return Result.Failure<AuthorizationResponse>(
                System.Net.HttpStatusCode.InternalServerError,
                AuthService.Common.Constants.Errors.DefaultErrors.InternalServerError("Authorization URL is not available."));
        }

        logger.LogInformation("Google authorization handler used provider {ProviderType}", provider.GetType().Name);
        logger.LogInformation("Generated Google auth URL: {Url}", authorizationResponse.AuthorizationUrl);

        // Log redirect_uri query param
        try
        {
            var uri = new Uri(authorizationResponse.AuthorizationUrl);
            var query = QueryHelpers.ParseQuery(uri.Query);
            if (query.TryGetValue("redirect_uri", out var redirect))
                logger.LogInformation("redirect_uri param: {Redirect}", redirect.ToString());
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to parse authorization URL");
        }

        return Result<AuthorizationResponse>.Success(authorizationResponse);
    }
}