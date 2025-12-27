using AuthService.Common.ResultPattern;
using MediatR;

namespace AuthService.Application.Features.Authentication.RevokeToken;

public record RevokeRefreshTokenCommand(string RefreshToken) : IRequest<Result>;