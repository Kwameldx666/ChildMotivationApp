using AuthService.Application.Dto.Auth.Login;
using AuthService.Common.ResultPattern;
using MediatR;

namespace AuthService.Application.Features.Authentication.RefreshTokens;

public record RefreshTokenCommand(string RefreshToken) : IRequest<Result<LoginResponse>>;