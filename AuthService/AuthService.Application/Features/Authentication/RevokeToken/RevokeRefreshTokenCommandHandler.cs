using System.Net;
using AuthService.Application.Abstractions.Persistence;
using AuthService.Common.Constants.Errors;
using AuthService.Common.ResultPattern;
using MediatR;

namespace AuthService.Application.Features.Authentication.RevokeToken;

public class RevokeRefreshTokenCommandHandler(
    IRefreshTokenRepository refreshTokenRepository,
    IUnitOfWork unitOfWork)
    : IRequestHandler<RevokeRefreshTokenCommand, Result>
{
    public async Task<Result> Handle(RevokeRefreshTokenCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.RefreshToken))
            return Result.Failure(HttpStatusCode.BadRequest,
                AuthorizationErrors.Unauthorized("Refresh token is required."));

        var refreshToken = await refreshTokenRepository.GetByTokenAsync(request.RefreshToken, cancellationToken);

        if (refreshToken is null) return Result.Success(HttpStatusCode.NoContent);

        refreshTokenRepository.Remove(refreshToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success(HttpStatusCode.NoContent);
    }
}