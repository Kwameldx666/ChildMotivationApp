using AuthService.Domain.Entities;

namespace AuthService.Application.Abstractions.Persistence;

public interface IRefreshTokenRepository
{
    Task<RefreshToken?> GetByTokenAsync(string refreshToken, CancellationToken cancellationToken = default);
    Task<RefreshToken?> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task AddAsync(RefreshToken refreshToken, CancellationToken cancellationToken = default);
    void Update(RefreshToken refreshToken);
    void Remove(RefreshToken refreshToken);
    Task DeleteExpiredRefreshTokensAsync(CancellationToken cancellationToken = default);
}