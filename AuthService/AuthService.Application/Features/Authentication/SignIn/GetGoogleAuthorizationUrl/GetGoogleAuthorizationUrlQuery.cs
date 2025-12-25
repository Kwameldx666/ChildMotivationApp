using AuthService.Application.Dto.Auth.SignIn;
using AuthService.Common.ResultPattern;
using MediatR;

namespace AuthService.Application.Features.Authentication.SignIn.GetGoogleAuthorizationUrl;

public record GetGoogleAuthorizationUrlQuery : IRequest<Result<GoogleAuthorizationResponse>>;