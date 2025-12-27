using AuthService.Application.Features.Authentication.External.Shared.Dto;

namespace AuthService.Application.Abstractions.Authentication.External;

public interface IExternalAuthProvider
{
    Task<HttpResponseMessage> RequestAccessToken(string code, CancellationToken cancellationToken);
    Task<HttpResponseMessage> RequestUserInfo(string accessToken, CancellationToken cancellationToken);
    AuthorizationResponse BuildAuthQuery(string state, string[] scopes);
}