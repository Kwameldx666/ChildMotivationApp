using AuthService.Application.Abstractions.Authentication.External;
using AuthService.Application.Features.Authentication.External.Shared.Dto;
using AuthService.Common.ResultPattern;
using AuthService.Domain.Enums;
using AuthService.Application.Enums;
using AuthService.Common.Constants.Errors;
using MediatR;
using Microsoft.Extensions.DependencyInjection;

namespace AuthService.Application.Features.Authentication.External.GitHub.GetAuthorizationUrl;

using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Logging;

public class GetGitHubAuthorizationUrlQueryHandler(
    IOAuthStateStore stateStore,
    IServiceProvider serviceProvider,
    ILogger<GetGitHubAuthorizationUrlQueryHandler> logger)
    : IRequestHandler<GetGitHubAuthorizationUrlQuery, Result<AuthorizationResponse>>
{
    public async Task<Result<AuthorizationResponse>> Handle(GetGitHubAuthorizationUrlQuery request,
        CancellationToken cancellationToken)
    {
        var state = await stateStore.CreateStateAsync(cancellationToken);

        var providerFactory = serviceProvider
            .GetService<AuthService.Application.Abstractions.Authentication.External.IExternalAuthProviderFactory>();
        var provider = providerFactory?.GetProvider(ExternalProviderType.GitHub)
                       ?? serviceProvider
                           .GetRequiredService<AuthService.Application.Abstractions.Authentication.External.
                               IExternalAuthProvider>();

        AuthorizationResponse authResponse;

        try
        {
            authResponse = provider.BuildAuthQuery(state, ExternalScopes.GitHub.ToArray());
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to build GitHub authorization URL using provider {Provider}",
                provider.GetType().Name);
            return Result.Failure<AuthorizationResponse>(
                System.Net.HttpStatusCode.InternalServerError,
                DefaultErrors.InternalServerError("Failed to build authorization URL."));
        }

        if (authResponse is null || string.IsNullOrWhiteSpace(authResponse.AuthorizationUrl))
        {
            logger.LogError("Provider {Provider} returned an empty authorization URL.", provider.GetType().Name);
            return Result.Failure<AuthorizationResponse>(
                System.Net.HttpStatusCode.InternalServerError,
                DefaultErrors.InternalServerError(
                    "Authorization URL is not available."));
        }

        logger.LogInformation("GitHub authorization handler used provider {ProviderType}", provider.GetType().Name);
        logger.LogInformation("Generated GitHub auth URL: {Url}", authResponse.AuthorizationUrl);

        try
        {
            var uri = new Uri(authResponse.AuthorizationUrl);
            var query = QueryHelpers.ParseQuery(uri.Query);
            if (query.TryGetValue("redirect_uri", out var redirect))
                logger.LogInformation("redirect_uri param: {Redirect}", redirect.ToString());
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to parse authorization URL");
        }

        return Result<AuthorizationResponse>.Success(authResponse);
    }
}