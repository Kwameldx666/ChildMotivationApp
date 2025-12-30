using AuthService.Application.Dto.Token;
using AuthService.Application.Dto.User;
using AuthService.Application.Enums;
using AuthService.Common.ResultPattern;

namespace AuthService.Application.Abstractions.Authentication.External;

public interface IExternalAuthProvider
{
    ExternalProviderType ProviderType { get; }
    
    Task<Result<ExternalAuthToken>> RequestAccessToken(string code, CancellationToken cancellationToken);
    Task<Result<ExternalUserInfo>> RequestUserInfo(string accessToken, CancellationToken cancellationToken);
    AuthorizationUrlResponse BuildAuthQuery(string state, string[] scopes);
}