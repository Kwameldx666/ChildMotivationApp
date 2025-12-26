using AuthService.Application.Dto.Auth.SignIn;
using AuthService.Common.ResultPattern;
using MediatR;

namespace AuthService.Application.Features.Authentication.SignIn.Google.GetGoogleAuthorizationUrl;

public record GetGoogleAuthorizationUrlQuery : IRequest<Result<AuthorizationResponse>>;