using AuthService.Application.Features.Authentication.SignIn.Shared.Dto;
using AuthService.Common.ResultPattern;
using MediatR;

namespace AuthService.Application.Features.Authentication.SignIn.Google.GetAuthorizationUrl;

public record GetGoogleAuthorizationUrlQuery : IRequest<Result<AuthorizationResponse>>;