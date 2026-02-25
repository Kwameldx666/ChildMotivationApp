using AuthService.Application.Abstractions.Authentication.External;
using AuthService.Application.Dto.User;
using AuthService.Application.Enums;
using AuthService.Common.ResultPattern;
using AuthService.Domain.Enums;
using MediatR;
using Microsoft.Extensions.Logging;

namespace AuthService.Application.Features.Authentication.External.Google.GetAuthorizationUrl;

public class GetGoogleAuthorizationUrlQueryHandler(
    IOAuthStateStore stateStore,
    IExternalAuthProviderFactory providerFactory,
    Microsoft.Extensions.Logging.ILogger<GetGoogleAuthorizationUrlQueryHandler> logger)
    : IRequestHandler<GetGoogleAuthorizationUrlQuery, Result<AuthorizationUrlResponse>>
{
    public async Task<Result<AuthorizationUrlResponse>> Handle(GetGoogleAuthorizationUrlQuery request,
        CancellationToken cancellationToken)
    {
        var state = await stateStore.CreateStateAsync(ExternalProviderType.Google, cancellationToken);

        try
        {
            var provider = providerFactory.GetProvider(ExternalProviderType.Google);
            var authorizationResponse = provider.BuildAuthQuery(state, ExternalScopes.Google.All.ToArray());
            return Result<AuthorizationUrlResponse>.Success(authorizationResponse);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to get Google authorization URL");
            return Result<AuthorizationUrlResponse>.Failure(System.Net.HttpStatusCode.InternalServerError, AuthService.Common.Constants.Errors.DefaultErrors.InternalServerError("Google provider resolution failed."));
        }
    }
}