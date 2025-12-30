using AuthService.Application.Abstractions.Authentication.External;
using AuthService.Application.Dto.User;
using AuthService.Application.Enums;
using AuthService.Common.ResultPattern;
using AuthService.Domain.Enums;
using MediatR;
using System.Net;
using AuthService.Common.Constants.Errors;
using Microsoft.Extensions.Logging;

namespace AuthService.Application.Features.Authentication.External.Discord.GetAuthorizationUrl;

public class GetDiscordAuthorizationUrlQueryHandler(
    IExternalAuthProviderFactory providerFactory,
    IOAuthStateStore stateStore,
    Microsoft.Extensions.Logging.ILogger<GetDiscordAuthorizationUrlQueryHandler> logger) : IRequestHandler<GetDiscordAuthorizationUrlQuery, Result<AuthorizationUrlResponse>>
{
    public async Task<Result<AuthorizationUrlResponse>> Handle(GetDiscordAuthorizationUrlQuery request,
        CancellationToken cancellationToken)
    {
        var state = await stateStore.CreateStateAsync(ExternalProviderType.Discord, cancellationToken);
        logger.LogInformation("GetDiscordAuthorizationUrl: created state (preview) {StatePreview}", state?.Substring(0, Math.Min(8, state.Length)));
        var provider = providerFactory.GetProvider(ExternalProviderType.Discord);

        try
        {
            var query = provider.BuildAuthQuery(state, ExternalScopes.Discord.All.ToArray());
            return Result<AuthorizationUrlResponse>.Success(query);
        }
        catch (Exception)
        {
            return Result<AuthorizationUrlResponse>.Failure(HttpStatusCode.InternalServerError, AuthService.Common.Constants.Errors.DefaultErrors.InternalServerError("Discord is not configured or is misconfigured."));
        }
    }
}