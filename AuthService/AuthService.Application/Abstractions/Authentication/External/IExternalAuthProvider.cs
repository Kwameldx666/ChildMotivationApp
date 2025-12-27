using AuthService.Application.Dto.Token;
using AuthService.Application.Dto.User;
using AuthService.Application.Features.Authentication.External.Shared.Dto;
using AuthService.Common.ResultPattern;

namespace AuthService.Application.Abstractions.Authentication.External;

public interface IExternalAuthProvider
{
    Task<Result<ExternalAuthToken>> RequestAccessToken(string code, CancellationToken cancellationToken);
    Task<Result<ExternalUserInfo>> RequestUserInfo(string accessToken, CancellationToken cancellationToken);
    AuthorizationResponse BuildAuthQuery(string state, string[] scopes);
}