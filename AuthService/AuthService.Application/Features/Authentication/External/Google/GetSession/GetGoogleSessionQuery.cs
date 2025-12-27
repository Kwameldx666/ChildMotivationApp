using AuthService.Application.Dto.Auth.Login;
using AuthService.Common.ResultPattern;
using MediatR;

namespace AuthService.Application.Features.Authentication.SignIn.Google.GetSession;

public record GetGoogleSessionQuery(string Token) : IRequest<Result<ExternalLoginResponse>>;