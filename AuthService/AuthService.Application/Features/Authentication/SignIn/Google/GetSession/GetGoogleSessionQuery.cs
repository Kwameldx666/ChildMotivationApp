using AuthService.Application.Dto.Auth.Login;
using AuthService.Common.ResultPattern;
using MediatR;

namespace AuthService.Application.Features.Authentication.SignIn.Google.GetGoogleSession;

public record GetGoogleSessionQuery(string Token) : IRequest<Result<ExternalLoginResponse>>;