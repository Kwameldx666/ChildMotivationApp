using AuthService.Domain.Entities;

namespace AuthService.Application.Abstractions.Persistence;

public interface IRefreshTokenRepository
{
    Task<RefreshToken?> GetRefreshTokenByRefreshToken(string refreshTokenRequest);
    Task SaveChangesAsync();
    void UpdateRefreshToken(RefreshToken refreshToken);
}